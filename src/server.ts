import 'dotenv/config';

import express, { Request, Response } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { PubSub, Message } from '@google-cloud/pubsub';
import { ObjectID } from 'bson';

const app = express();

const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '';
const pubSubProjectId = process.env.PUBSUB_PROJECT_ID || '';
const pubSubTopicEnquiry = process.env.PUBSUB_TOPIC_ENQUIRY || '';
const pubSubSubscriptionId = process.env.PUBSUB_SUBSCRIPTION_ID || '';

import MailController from './controllers/mail.controller';
import ApiKeyController from './controllers/apikey.controller';
const mailController = new MailController();
const apiKeyController = new ApiKeyController();

import { connectDB } from './config/db.config';
import { queryService } from './services';

app.use(express.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const init = async () => {
    const db = await connectDB(process.env.MONGO_URL, process.env.MONGO_DB);

    const pubsub = new PubSub({
        projectId: pubSubProjectId,
    });

    const subscription = pubsub.subscription(pubSubSubscriptionId);

    // Create an event handler to handle messages
    const messageHandler = async (message: Message) => {
        const messageToJSON = JSON.parse(JSON.parse(message.data.toString()));
        const publisherId = messageToJSON.publisherInfo.id;
        const typeOfMessage = messageToJSON.type;
        const typeOfAuthentication =
            messageToJSON.darIntegration.outbound.auth.type;

        const urlDarTransformations = process.env.URL_TRANSFORMATION || '';
        const dataTransformation = {
            data: messageToJSON.details.questionBank,
        };

        process.stdout.write(
            `MESSAGE RECEIVED FROM PUBSUB : ${JSON.stringify(messageToJSON)}\n`,
        );
        process.stdout.write(
            `Message deliveryAttempt: ${JSON.stringify(
                message.deliveryAttempt,
            )}\n`,
        );

        const responseTransformation =
            await apiKeyController.sendPostRequestCloudFuntion(
                `${urlDarTransformations}`,
                JSON.stringify(dataTransformation),
            );

        let response;
        if (typeOfAuthentication === 'api_key') {
            const baseUrl =
                messageToJSON.darIntegration.outbound.endpoints.baseURL;
            const endpoint =
                messageToJSON.darIntegration.outbound.endpoints[typeOfMessage];
            const urlEndpoint = `${baseUrl}${endpoint}`;
            const secretKey =
                messageToJSON.darIntegration.outbound.auth.secretKey;

            response = await apiKeyController.sendPostRequest(
                urlEndpoint,
                JSON.stringify(messageToJSON.details),
                {},
                secretKey,
            );
        }

        let emailSubject, emailText;
        if (response.success) {
            emailSubject = `Response Status: ${response.status} - ${message.deliveryAttempt}`;
            emailText =
                'Lorem ipsum dolor sit amet, consectetur adipiscing elit. In quis hendrerit leo, quis vestibulum dolor.';

            message.ack();
        } else {
            switch (response.status) {
                case 401:
                case 403:
                    emailSubject = `Gateway Outbound - Authorisation Error - ${response.status}`;
                    emailText = `Lorem ipsum... authorisation error.`;

                    // disable dar-integration immediately for unauthorised requests
                    await queryService.findOneAndUpdate(
                        db,
                        'publishers',
                        {
                            _id: new ObjectID(publisherId),
                        },
                        { $set: { 'dar-integration.enabled': false } },
                    );

                    break;

                case 500:
                    emailSubject = `Gateway Outbound - Server Error - ${response.status}`;
                    emailText = `Lorem ipsum... server error.`;

                    if (message.deliveryAttempt >= 5) {
                        // disable dar-integration is 5 attempts passed...
                        await queryService.findOneAndUpdate(
                            db,
                            'publishers',
                            {
                                _id: new ObjectID(publisherId),
                            },
                            { $set: { 'dar-integration.enabled': false } },
                        );
                    }
                    break;

                default:
                    emailSubject = `Gateway Outbound - Error`;
                    emailText = `Lorem ipsum... unknown error.`;
            }

            mailController.setFromEmail('from@email.com');
            mailController.setToEmail('to@email.com');
            mailController.setSubjectEmail(emailSubject);
            mailController.setTextEmail(emailText);

            await mailController.sendEmail();

            message.nack();
        }
    };

    // Listen for new messages until timeout is hit
    subscription.on('message', messageHandler);

    subscription.on('error', (error) => {
        console.error(`Error in pubsub subscription: ${error.message}`, {
            error,
            pubSubTopicEnquiry,
            pubSubSubscriptionId,
        });
    });

    subscription.on('close', () => {
        console.error('Pubsub subscription closed', {
            pubSubTopicEnquiry,
            pubSubSubscriptionId,
        });
    });
};

init();

// basic state request
app.get('/', (req: Request, res: Response) => {
    res.json({
        message: 'Gateway Outbound',
    });
});

// stop all other requests
app.use((req: Request, res: Response) => {
    res.status(404).send({
        message: 'Not found',
    });
});

app.listen(PORT, () => {
    process.stdout.write(`Listening on ${HOST}\n`);
});

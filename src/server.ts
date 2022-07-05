import 'dotenv/config';

import express, { Request, Response } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import moment from 'moment';
import { PubSub, Message } from '@google-cloud/pubsub';
import { LoggingService } from './services/index';

const app = express();
const logger = new LoggingService();

const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '';
const pubSubProjectId = process.env.PUBSUB_PROJECT_ID || '';
const pubSubTopicEnquiry = process.env.PUBSUB_TOPIC_ENQUIRY || '';
const pubSubSubscriptionId = process.env.PUBSUB_SUBSCRIPTION_ID || '';

import MailController from './controllers/mail.controller';
import ApiKeyController from './controllers/apikey.controller';
const mailController = new MailController();
const apiKeyController = new ApiKeyController();

app.use(express.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// basic state request
app.get('/', (req: Request, res: Response) => {
    res.json({
        message: 'Gateway Outbound',
    });
});

{
    const pubsub = new PubSub({
        projectId: pubSubProjectId
    });

    const subscription = pubsub.subscription(pubSubSubscriptionId);

    // Create an event handler to handle messages
    const messageHandler = async (message: Message) => {
        
        const datetime = moment().format('mmmm do yyyy, hh:mm:ss a');
        process.stdout.write(`\n----------------------------------------------------------------\n`);
        const messageToJSON = JSON.parse(JSON.parse( message.data.toString()));

        const typeOfMessage = messageToJSON.type;
        const typeOfAuthentification = messageToJSON.darIntegration.outbound.auth.type;

        const urlDarTransformations = process.env.URL_TRANSFORMATION || '';
        const dataTransformation = {
            data: messageToJSON.details.questionBank,
        }
        // console.log(messageToJSON);
        // console.log(dataTransformation);
        const responseTransformation = await apiKeyController.sendPostRequestCloudFuntion(
            `${urlDarTransformations}`, 
            JSON.stringify(dataTransformation),
        );
        console.log(responseTransformation);

        let response;
        if (typeOfAuthentification === 'api_key') {
            const baseUrl = messageToJSON.darIntegration.outbound.endpoints.baseURL;
            const endpoint = messageToJSON.darIntegration.outbound.endpoints[typeOfMessage];
            const urlEndpoint = `${baseUrl}${endpoint}`;
            const secretKey = messageToJSON.darIntegration.outbound.auth.secretKey;

            response = await apiKeyController.sendPostRequest(
                urlEndpoint, 
                JSON.stringify(messageToJSON.details), 
                {}, 
                secretKey,
            );
        }

        process.stdout.write(response.status);
        process.stdout.write(`\tMessage deliveryAttempt: ${JSON.stringify(message.deliveryAttempt)}\n`);
        if (response.status === 'error') {
            mailController.setFromEmail('from@email.com');
            mailController.setToEmail('to@email.com');
            mailController.setSubjectEmail(`Response Status: ${response.status} - ${message.deliveryAttempt}`);
            const textEmail = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. In quis hendrerit leo, quis vestibulum dolor.';
            mailController.setTextEmail(textEmail);
            await mailController.sendEmail();

            logger.sendDataInLogging(response, 'ERROR');

            message.nack();
        }

        if (response.status === 'success') {
            mailController.setFromEmail('from@email.com');
            mailController.setToEmail('to@email.com');
            mailController.setSubjectEmail(`Response Status: ${response.status} - ${message.deliveryAttempt}`);
            const textEmail = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. In quis hendrerit leo, quis vestibulum dolor.';
            mailController.setTextEmail(textEmail);
            await mailController.sendEmail();

            logger.sendDataInLogging(response, 'INFO');

            message.ack();
        }

        logger.sendDataInLogging(JSON.parse(message.data.toString()), 'INFO');
    };

    // Listen for new messages until timeout is hit
    subscription.on('message', messageHandler);
    
    subscription.on('error', (error) => {
        console.error(`Error in pubsub subscription: ${error.message}`, {
            error, pubSubTopicEnquiry, pubSubSubscriptionId,
        });
    });
    
    subscription.on('close', () => {
        console.error('Pubsub subscription closed', {
            pubSubTopicEnquiry, pubSubSubscriptionId,
        });
    });
 
    process.stdout.write('Done!\n');
}

// stop all other requests
app.use((req: Request, res: Response) => {
    res.status(404).send({
        message: 'Not found',
    });
});

app.listen(PORT, () => {
    process.stdout.write(`listening on ${HOST}\n`);
});

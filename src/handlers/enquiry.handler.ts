import { Db } from 'mongodb';
import { ObjectID } from 'bson';
import { Message } from '@google-cloud/pubsub';

import { queryService } from '../services';
import MailController from '../controllers/mail.controller';
import ApiKeyController from '../controllers/apikey.controller';

const mailController = new MailController();
const apiKeyController = new ApiKeyController();

export const messageHandler = async (message: Message, db: Db) => {
    const urlDarTransformations = process.env.URL_TRANSFORMATION || '';

    const messageToJSON = JSON.parse(JSON.parse(message.data.toString()));

    const mailAddressees = messageToJSON.darIntegration.notificationEmail || [];
    const publisherId = messageToJSON.publisherInfo.id;
    const typeOfMessage = messageToJSON.type;
    const typeOfAuthentication =
        messageToJSON.darIntegration.outbound.auth.type;

    process.stdout.write(
        `MESSAGE RECEIVED FROM PUBSUB : ${JSON.stringify(messageToJSON)}\n`,
    );
    process.stdout.write(
        `Message deliveryAttempt: ${JSON.stringify(message.deliveryAttempt)}\n`,
    );

    const responseTransformation =
        await apiKeyController.sendPostRequestCloudFuntion(
            `${urlDarTransformations}`,
            JSON.stringify({
                data: messageToJSON.details.questionBank,
            }),
        );

    let response;
    if (typeOfAuthentication === 'api_key') {
        const baseUrl = messageToJSON.darIntegration.outbound.endpoints.baseURL;
        const endpoint =
            messageToJSON.darIntegration.outbound.endpoints[typeOfMessage];
        const urlEndpoint = `${baseUrl}${endpoint}`;
        const secretKey = messageToJSON.darIntegration.outbound.auth.secretKey;

        response = await apiKeyController.sendPostRequest(
            urlEndpoint,
            JSON.stringify(messageToJSON.details),
            {},
            secretKey,
        );
    }

    let emailSubject, emailText;
    mailController.setFromEmail('from@email.com');
    mailController.setToEmail(mailAddressees);

    // IF POST to remote server was successful
    if (response.success) {
        emailSubject = `Response Status: ${response.status} - ${message.deliveryAttempt}`;
        emailText =
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit. In quis hendrerit leo, quis vestibulum dolor.';

        mailController.setSubjectEmail(emailSubject);
        mailController.setTextEmail(emailText);
        await mailController.sendEmail();

        return message.ack();
    }

    // ELSE respond to the relevant error code.
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

            break;

        default:
            emailSubject = `Gateway Outbound - Error`;
            emailText = `Lorem ipsum... unknown error.`;
    }

    mailController.setSubjectEmail(emailSubject);
    mailController.setTextEmail(emailText);
    await mailController.sendEmail();

    return message.nack();
};

import { Db } from 'mongodb';
import { ObjectID } from 'bson';
import { Message } from '@google-cloud/pubsub';

import { queryService } from '../services';
import MailController from '../controllers/mail.controller';
import secretService from '../services/secretclient.service';
import ApiKeyController from '../controllers/apikey.controller';

const mailController = new MailController();
const apiKeyController = new ApiKeyController();

export const messageHandler = async (message: Message, db: Db) => {
    const urlDarTransformations = process.env.URL_TRANSFORMATION || '';

    const messageToJSON = JSON.parse(JSON.parse(message.data.toString()));

    process.stdout.write(
        `MESSAGE RECEIVED FROM PUBSUB: ${JSON.stringify(messageToJSON)}\n`,
    );
    process.stdout.write(
        `Message deliveryAttempt: ${JSON.stringify(message.deliveryAttempt)}\n`,
    );

    const {
        type: typeOfMessage,
        publisherInfo: { id: publisherId },
        darIntegration: {
            notificationEmail: mailAddressees,
            outbound: {
                auth: {
                    type: typeOfAuthentication,
                    secretKey: clientSecretKey,
                },
                endpoints,
            },
        },
        details: { questionBank: questionBankData },
    } = messageToJSON;

    // If type is DAR Application, transform into required format.
    if (typeOfMessage === '5safes') {
        const transformedQuestionAnswers =
            await apiKeyController.sendPostRequestCloudFuntion(
                `${urlDarTransformations}`,
                JSON.stringify({
                    data: questionBankData,
                }),
            );

        messageToJSON.details.questionBank = transformedQuestionAnswers;
    }

    let response;
    if (typeOfAuthentication === 'api_key') {
        const urlEndpoint = `${endpoints.baseURL}${endpoints[typeOfMessage]}`;
        const secretKey = clientSecretKey;

        const APIKey = await secretService(secretKey);

        response = await apiKeyController.sendPostRequest(
            urlEndpoint,
            JSON.stringify(messageToJSON.details),
            {},
            APIKey,
        );
    }

    let emailSubject, emailText;
    mailController.setFromEmail(process.env.MAIL_HDRUK_ADDRESS);
    mailController.setToEmail(mailAddressees);

    // IF POST to remote server was successful - acknowledge message from PubSub.
    if (response.success) {
        emailSubject = `Response Status: ${response.status} - ${message.deliveryAttempt}`;
        emailText =
            'A message has been successfully sent to the target server.';

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

            // Prevent any further attempts if an auth error is encountered
            message.ack();

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

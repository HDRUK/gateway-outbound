import { Db } from 'mongodb';
import { ObjectID } from 'bson';
import { Message } from '@google-cloud/pubsub';

import { queryService } from '../services';
import { sendEmailSuccess, sendEmailFourHoundred, sendEmailFiveHoundred } from '../utils/email.util';
import secretService from '../services/secrets.service';
import ApiKeyController from '../controllers/apikey.controller';

const apiKeyController = new ApiKeyController();

export const messageHandler = async (message: Message, db: Db) => {
    const urlDarTransformations = process.env.URL_TRANSFORMATION || '';

    const messageToJSON = JSON.parse(JSON.parse(message.data.toString()));

    process.stdout.write(
        `MESSAGE RECEIVED FROM PUBSUB: ${JSON.stringify(messageToJSON)}\n`,
    );
    process.stdout.write(
        `DELIVERY ATTEMPT NO. ${JSON.stringify(message.deliveryAttempt)}\n`,
    );

    const {
        type: typeOfMessage,
        publisherInfo: { id: publisherId, name },
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

    // If type is DAR Application, transform into required format
    if (typeOfMessage === '5safes') {
        const transformedDataResponse =
            await apiKeyController.sendPostRequestCloudFuntion(
                `${urlDarTransformations}`,
                JSON.stringify({
                    data: questionBankData,
                }),
            );

        if (!transformedDataResponse.success) {
            return message.nack();
        }

        messageToJSON.details.questionBank = transformedDataResponse.data;
    }

    let response, urlEndpoint;
    if (typeOfAuthentication === 'api_key') {
        urlEndpoint = `${endpoints.baseURL}${endpoints[typeOfMessage]}`;
        const secretKey = clientSecretKey;

        const APIKey = await secretService(secretKey);

        response = await apiKeyController.sendPostRequest(
            urlEndpoint,
            JSON.stringify(messageToJSON.details),
            {},
            APIKey,
        );
    }

    // IF POST to remote server was successful - acknowledge message from PubSub
    if (response.success) {
        await sendEmailSuccess(mailAddressees, response.status, message.deliveryAttempt);

        process.stdout.write(
            `SUCCESSFULLY SUBMITTED ${typeOfMessage} FOR PUBLISHER ${publisherId} `,
        );

        return message.ack();
    }

    // ELSE respond to the relevant error code.
    switch (response.status) {
        case 401:
        case 403:
            await sendEmailFourHoundred(mailAddressees, name, urlEndpoint);

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
            await sendEmailFiveHoundred(mailAddressees, name, urlEndpoint);

            process.stdout.write(`SERVER ERROR`);
            break;

        default:
            process.stdout.write(
                `UNKNOWN ERROR: status code ${response.status}`,
            );
    }

    return message.nack();
};

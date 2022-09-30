import { Db } from 'mongodb';
import { ObjectID } from 'bson';
import { Message } from '@google-cloud/pubsub';

import { queryService, googleService } from '../services';
import {
    sendEmailSuccess,
    sendEmailFourHoundred,
    sendEmailFiveHoundred,
} from '../utils/email.util';
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
        details: { questionBank: questionBankData, files, dataRequestId },
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

        let formattedFiles = [];
        if (files) {
            files
                .filter((file) => file.status === 'SCANNED')
                .forEach(async (safeFile) => {
                    const filepath: string = `dar/${dataRequestId}/${
                        safeFile.fileId + '_' + safeFile.name
                    }`;

                    const [signedURL, expiryTime] =
                        await googleService.generateV4SignedURL(filepath);

                    formattedFiles.push({
                        name: safeFile.name,
                        description: safeFile.description,
                        signedURL: signedURL,
                        expires: expiryTime,
                    });
                });
        }

        transformedDataResponse.data.additionalinformationfiles =
            formattedFiles;
        messageToJSON.details.questionBank = transformedDataResponse.data;
        delete messageToJSON.details.files;
    }

    let response, urlEndpoint;
    if (typeOfAuthentication === 'api_key') {
        urlEndpoint = `${endpoints.baseURL}${endpoints[typeOfMessage]}`;
        const secretKey = clientSecretKey;

        const APIKey = await googleService.getClientSecret(secretKey);

        response = await apiKeyController.sendPostRequest(
            urlEndpoint,
            JSON.stringify(messageToJSON.details),
            {},
            APIKey || 'no_bearer_given',
        );
    }

    process.stdout.write(
        `RESPONSE - success : ${response.success}\n`,
    );

    process.stdout.write(
        `RESPONSE - status : ${response.status}\n`,
    );

    // IF POST to remote server was successful - acknowledge message from PubSub
    if (response.success) {
        await sendEmailSuccess(
            mailAddressees,
            response.status,
            message.deliveryAttempt,
        );

        process.stdout.write(
            `SUCCESSFULLY SUBMITTED ${typeOfMessage} FOR PUBLISHER ${publisherId}: ${JSON.stringify(
                messageToJSON.details,
            )}\n`,
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
            // Only send 500 email on last attempt
            if (message.deliveryAttempt > 4) {
                await sendEmailFiveHoundred(mailAddressees, name, urlEndpoint);
            }

            process.stdout.write(`SERVER ERROR\n`);
            break;

        default:
            process.stdout.write(
                `UNKNOWN ERROR: status code ${response.status}\n`,
            );
    }

    return message.nack();
};

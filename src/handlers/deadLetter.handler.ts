import { Db } from 'mongodb';
import { ObjectID } from 'bson';
import { Message } from '@google-cloud/pubsub';

import { queryService } from '../services';

import {sendEmailDeadLetter} from '../utils/email.util';

export const deadLetterHandler = async (message: Message, db: Db) => {
    const messageToJSON = JSON.parse(JSON.parse(message.data.toString()));

    const {
        publisherInfo: { name },
        darIntegration: { notificationEmail: mailAddressees },
        publisherInfo: { id: publisherId },
    } = messageToJSON;

    process.stdout.write(
        `DEAD LETTER MESSAGE RECEIVED: ${JSON.stringify(messageToJSON)}\n`,
    );

    process.stdout.write(
        `DISABLING DAR INTEGRATION FOR PUBLISHER ${publisherId}\n`,
    );

    // Disable dar-integration for publisher if dead letter received.
    await queryService.findOneAndUpdate(
        db,
        'publishers',
        {
            _id: new ObjectID(publisherId),
        },
        { $set: { 'dar-integration.enabled': false } },
    );

    await sendEmailDeadLetter(mailAddressees, name);

    return message.ack();
};

import { Db } from 'mongodb';
import { ObjectID } from 'bson';
import { Message } from '@google-cloud/pubsub';

import { queryService } from '../services';
import MailController from '../controllers/mail.controller';

const mailController = new MailController();

export const deadLetterHandler = async (message: Message, db: Db) => {
    const messageToJSON = JSON.parse(JSON.parse(message.data.toString()));

    const {
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

    mailController.setFromEmail(process.env.MAIL_HDRUK_ADDRESS);
    mailController.setToEmail(mailAddressees);
    mailController.setSubjectEmail(
        `DAR Integration disabled for publisher ${publisherId}`,
    );
    mailController.setTextEmail('Lorem ipsum... dead letter.');

    await mailController.sendEmail();

    return message.ack();
};

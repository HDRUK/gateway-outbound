import { Db } from 'mongodb';
import { ObjectID } from 'bson';
import { Message } from '@google-cloud/pubsub';

import { queryService } from '../services';
import MailController from '../controllers/mail.controller';

const mailController = new MailController();

export const deadLetterHandler = async (message: Message, db: Db) => {
    const messageToJSON = JSON.parse(JSON.parse(message.data.toString()));
    const mailAddressees = messageToJSON.darIntegration.notificationEmail || [];
    const publisherId = messageToJSON.publisherInfo.id;

    process.stdout.write(
        `DEAD LETTER MESSAGE RECEIVED: ${JSON.stringify(messageToJSON)}\n`,
    );

    // Disable dar-integration for relevant publisher
    await queryService.findOneAndUpdate(
        db,
        'publishers',
        {
            _id: new ObjectID(publisherId),
        },
        { $set: { 'dar-integration.enabled': false } },
    );

    mailController.setFromEmail('from@email.com');
    mailController.setToEmail(mailAddressees);
    mailController.setSubjectEmail(
        `DAR Integration disabled for publisher ${publisherId}`,
    );
    mailController.setTextEmail('Lorem ipsum... unknown error.');
    await mailController.sendEmail();

    return message.ack();
};

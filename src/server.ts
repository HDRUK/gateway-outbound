import 'dotenv/config';

import express, { Request, Response } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { PubSub } from '@google-cloud/pubsub';

const app = express();

const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '';
const pubSubProjectId = process.env.PUBSUB_PROJECT_ID || '';
const pubSubTopicEnquiry = process.env.PUBSUB_TOPIC_ENQUIRY || '';
const pubSubSubscriptionId = process.env.PUBSUB_SUBSCRIPTION_ID || '';
const pubSubDeadLetterSubscriptionId =
    process.env.PUBSUB_DEAD_LETTER_SUBSCRIPTION_ID || '';

import { connectDB } from './config/db.config';
import { messageHandler, deadLetterHandler } from './handlers/index';

app.use(express.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

( async () => {
    const pubsub = new PubSub({
        projectId: pubSubProjectId,
    });

    const db = await connectDB(process.env.MONGO_URL, process.env.MONGO_DB);

    const subscriptionEnquiry = pubsub.subscription(pubSubSubscriptionId);
    const subscriptionDeadLetter = pubsub.subscription(
        pubSubDeadLetterSubscriptionId,
    );

    // Listen for new messages on enquiry sub
    subscriptionEnquiry.on('message', (message) => {
        messageHandler(message, db);
    });

    // Listen for new messages on dead-letter sub
    subscriptionDeadLetter.on('message', (message) => {
        deadLetterHandler(message, db);
    });

    subscriptionEnquiry.on('error', (error) => {
        console.error(`Error in pubsub subscription: ${error.message}`, {
            error,
            pubSubTopicEnquiry,
            pubSubSubscriptionId,
        });
    });

    subscriptionEnquiry.on('close', () => {
        console.error('Pubsub subscription closed', {
            pubSubTopicEnquiry,
            pubSubSubscriptionId,
        });
    });
})().catch(err => {
    process.stdout.write(
        `ERROR: ${JSON.stringify(err)}\n`,
    );
});

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

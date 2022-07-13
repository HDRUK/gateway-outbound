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

import { connectDB } from './config/db.config';
import { messageHandler } from './handlers/pubsub.handler';

app.use(express.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const init = async () => {
    const pubsub = new PubSub({
        projectId: pubSubProjectId,
    });

    const db = await connectDB(process.env.MONGO_URL, process.env.MONGO_DB);

    const subscription = pubsub.subscription(pubSubSubscriptionId);

    // Listen for new messages until timeout is hit
    subscription.on('message', (message) => {
        messageHandler(message, db);
    });

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

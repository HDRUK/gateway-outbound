import 'dotenv/config';

import express, { Request, Response } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { createClient } from 'redis';
import { LoggingService } from './services';

const app = express();
const logger = new LoggingService();

const PORT = process.env.PORT || 3005;
const HOST = process.env.HOST;
const cacheUrl = process.env.CACHE_URL || '';
const cacheChannel = process.env.CACHE_CHANNEL || '';

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

(async () => {
    const client = createClient({
        url: cacheUrl,
    });

    await client.connect();

    await client.subscribe(cacheChannel, (message) => {
        logger.sendDataInLogging(message, 'INFO');
    });
})();

// stop all other requests
app.use((req: Request, res: Response) => {
    res.status(404).send({
        message: 'Not found',
    });
});

app.listen(PORT, () => {
    process.stdout.write(`listening on ${HOST}\n`);
});

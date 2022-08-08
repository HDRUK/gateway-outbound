import { MongoClient } from 'mongodb';

export const connectDB = async (uri: string, database: string) => {
    try {
        const client = await MongoClient.connect(uri);
        await client.connect();

        process.stdout.write('SUCCESSFULLY CONNECTED TO MONGODB\n');

        return client.db(database);
    } catch (err) {
        process.stdout.write(
            `ERROR CONNECTING TO MONGODB: ${JSON.stringify(err)}\n`,
        );
    }
};

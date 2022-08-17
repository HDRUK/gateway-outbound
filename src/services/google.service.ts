import { Storage } from '@google-cloud/storage';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const storage = new Storage({
    credentials: {
        client_email: process.env.STORAGE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.STORAGE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(
            /\\n/g,
            '\n',
        ),
    },
});
const secretClient = new SecretManagerServiceClient();

const getClientSecret = async (secretKey: string) => {
    try {
        const [version] = await secretClient.accessSecretVersion({
            name: secretKey,
        });
        const secret = version.payload.data.toString();

        return secret;
    } catch (error: any) {
        process.stdout.write(
            `ERROR RETRIEVING SECRET: ${JSON.stringify(error.details)}\n`,
        );
    }
};

const generatedV4SignedURL = async (filepath: string) => {
    const expiryTimeSeconds =
        parseInt(process.env.STORAGE_FILE_TIMEOUT_SECONDS) || 432000;
    const bucketName = process.env.STORAGE_FILE_SOURCE_BUCKET_NAME || '';
    const expiryTime = Date.now() + expiryTimeSeconds * 1000;

    const options: any = {
        version: 'v4',
        action: 'read',
        expires: expiryTime,
    };

    const [url] = await storage
        .bucket(bucketName)
        .file(filepath)
        .getSignedUrl(options);

    return [url, expiryTime];
};

export default { getClientSecret, generatedV4SignedURL };

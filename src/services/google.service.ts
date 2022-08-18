import { Storage } from '@google-cloud/storage';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const storageServiceAccountClientEmail: string =
    process.env.STORAGE_SERVICE_ACCOUNT_EMAIL || '';
const storageServiceAccountPrivateKey: string =
    process.env.STORAGE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, '\n') || '';

// Initiate storage with a separate service account
const storage = new Storage({
    credentials: {
        client_email: storageServiceAccountClientEmail,
        private_key: storageServiceAccountPrivateKey,
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

const generateV4SignedURL = async (filepath: string) => {
    const expiryTimeSeconds =
        parseInt(process.env.STORAGE_FILE_TIMEOUT_SECONDS) || 432000;
    const expiryTime = Date.now() + expiryTimeSeconds * 1000;
    const bucketName = process.env.STORAGE_FILE_SOURCE_BUCKET_NAME || '';

    const options: any = {
        version: 'v4',
        action: 'read',
        expires: expiryTime,
    };

    try {
        const [url] = await storage
            .bucket(bucketName)
            .file(filepath)
            .getSignedUrl(options);

        return [url, expiryTime];
    } catch (error: any) {
        process.stdout.write(
            `ERROR GENERATING SIGNED URL FOR ${filepath}: ${error}\n`,
        );

        throw new Error(error);
    }
};

export default { getClientSecret, generateV4SignedURL };

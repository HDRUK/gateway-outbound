import { Storage } from '@google-cloud/storage';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const storage = new Storage();
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
        parseInt(process.env.STORAGE_FILE_TIMEOUT_SECONDS) || 604800;
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

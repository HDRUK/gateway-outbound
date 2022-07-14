import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const secretClient = new SecretManagerServiceClient();

const getClientSecret = async (secretKey: string) => {
    try {
        const [version] = await secretClient.accessSecretVersion({
            name: secretKey,
        });
        const secret = version.payload.data.toString();

        return secret;
    } catch (err: any) {
        process.stdout.write(
            `ERROR RETRIEVING SECRET: ${JSON.stringify(err.details)}\n`,
        );
    }
};

export default getClientSecret;

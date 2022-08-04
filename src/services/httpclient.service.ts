import axios from 'axios';
const { GoogleAuth } = require('google-auth-library');

export default class HttpClientCervice {
    #axios;

    constructor() {
        this.#axios = axios;
    }

    async post(url, body, options, bearer = '') {
        const headers = {
            ...(options && options.headers),
            Accept: 'application/json',
            'Content-Type': 'application/json;charset=UTF-8',
            Cookie: 'AspxAutoDetectCookieSupport=1',
        };

        if (bearer) {
            this.#setBearer(bearer);
        }

        this.#axios.defaults.crossDomain = true;
        this.#axios.defaults.withCredentials = true;

        try {
            const response = await this.#axios.post(url, body, {
                ...options,
                headers,
                withCredentials: true,
            });

            return {
                success: true,
                status: response.status,
                response: response.data,
            };
        } catch (error: any) {
            process.stdout.write(
                `NETWORK ERROR - ${url}: ${JSON.stringify(error)}\n`,
            );

            return {
                success: false,
                status: error.response ? error.response.status : null,
                response: error,
            };
        }
    }

    async postCloudFuntion(url: string, body: string) {
        const auth = new GoogleAuth();

        try {
            process.stdout.write(`SENT FOR TRANSFORMATION: ${body}\n`);

            const client = await auth.getIdTokenClient(url);

            const response = await client.request({
                url,
                method: 'POST',
                data: JSON.parse(body),
            });

            return {
                success: true,
                data: response.data,
            };
        } catch (error) {
            process.stdout.write(
                `ERROR TRANFORMING DAR QUESTION ANSWERS: ${JSON.stringify(
                    error,
                )}\n`,
            );
            return {
                success: false,
                data: null,
            };
        }
    }

    #setBearer(bearer: string) {
        this.#axios.defaults.headers.common[
            'Authorization'
        ] = `Bearer ${bearer}`;
    }
}

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
            //     process.stdout.write(`POST URL : ${url}\n`);
            //     process.stdout.write(`POST BODY : ${JSON.stringify(body)}\n`);

            const response = await this.#axios.post(url, body, {
                ...options,
                headers,
                withCredentials: true,
            });

            // process.stdout.write(`RESPONSE RECEIVED : ${JSON.stringify(response.data)}\n`);

            return {
                success: true,
                status: response.status,
                response: response.data,
            };
        } catch (error: any) {
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
            // process.stdout.write(`SEND FOR TRANSFORMATION : ${body}\n`);

            const client = await auth.getIdTokenClient(url);

            const response = await client.request({
                url,
                method: 'POST',
                data: JSON.parse(body),
            });

            // process.stdout.write(
            //     `RESPONSE TRANSFORMATION : ${JSON.stringify(response.data)}\n`,
            // );

            return {
                status: 'success',
                response: response.data,
            };
        } catch (error) {
            process.stdout.write(
                `RESPONSE TRANSFORMATION : ${JSON.stringify(error)}\n`,
            );
            return {
                status: 'error',
                response: error,
            };
        }
    }

    #setBearer(bearer: string) {
        this.#axios.defaults.headers.common[
            'Authorization'
        ] = `Bearer ${bearer}`;
    }
}

import axios from 'axios';
const {GoogleAuth} = require('google-auth-library');

export default class HttpClientCervice {
    #axios;
    #googleAuth;

    constructor() {
        this.#axios = axios;
    }

    async post(url, body, options, bearer: string = '') {
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
                status: 'success',
                response: response.data,
            };
        } catch (error) {
            return {
                status: 'error',
                response: error,
            };
        }
    }

    async postCloudFuntion(url: string, body: string) {
        const auth = new GoogleAuth();

        console.log(JSON.parse(body));
        try {
            const client = await auth.getIdTokenClient(url);
            console.log(client);
            const response = await client.request({
                url,
                method: 'POST',
                data: JSON.parse(body),
            });
            console.log(response.data);
            return {
                status: 'success',
                response: response.data,
            };
        } catch (error) {
            console.log(error);
            return {
                status: 'error',
                response: error,
            };
        }
    }

    #setBearer(bearer: string) {
        this.#axios.defaults.headers.common['Authorization'] = `Bearer ${bearer}`;
    }
}
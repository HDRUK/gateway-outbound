import axios from 'axios';

export default class HttpClientCervice {
    #axios;

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

    #setBearer(bearer: string) {
        this.#axios.defaults.headers.common['Authorization'] = `Bearer ${bearer}`;
    }
}
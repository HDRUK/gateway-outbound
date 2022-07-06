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
        const auth = new GoogleAuth({
            projectId: process.env.PUBSUB_PROJECT_ID,
        });

        console.log(JSON.parse(body));
        try {
            const client = await auth.getIdTokenClient(url);
            console.log(client);
            // const client = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjI2NTBhMmNlNDdiMWFiM2JhNDA5OTc5N2Y4YzA2ZWJjM2RlOTI4YWMiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiIzMjU1NTk0MDU1OS5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbSIsImF1ZCI6IjMyNTU1OTQwNTU5LmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwic3ViIjoiMTAwNzQyMTI4ODY0Mzk1MjQ5NzkxIiwiZW1haWwiOiJkYW4ubml0YS5oZHJ1a0BnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiYXRfaGFzaCI6Im1LOHMtQTFod2JnVnhXTlRCOVRGR0EiLCJpYXQiOjE2NTcwMzIwODgsImV4cCI6MTY1NzAzNTY4OH0.hucOzt5FETmIF5-1kT0Jn8uVBkDw1IQLrYYQnddBmsI_YtN3LJ7gvPn_dwRWSc45SffariOPN8srgXtAIG9aQgD09dAsl4AHaSIC3qY5L5w68QyOEAFju80ew1NwUFeI3_4VoBttWt7NVyihjaORos9VYkIaX4zAe-xNDKsu1b2Dt5DezTDdFYqdTrlH1sadSkfVuwwOkK_CdAwoVTVj4NOX654mwXJQJsJdS5oJ-CiYoL1VaAyBJByyPqbhCYX2EW1ROeAShHmbT_gwy8Zmwk-cG2EfbXUToZcTs6hv_lPGv1qIoZRXW5W6GVm7bB-2Ji0n-VDcteoCGmbXJKvmig';
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
import { HttpClientService } from '../services';

class BaseController {
    #httpClient;

    constructor() {
        this.#httpClient = new HttpClientService();
    }

    async postRequest(url, body, options, bearer) {
        return await this.#httpClient.post(url, body, options, bearer);
    }

    async postRequestCloudFuntion(url, body) {
        return await this.#httpClient.postCloudFuntion(url, body);
    }
}

module.exports = BaseController;

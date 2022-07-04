// import { LoggingService } from '../services/google/LoggingService';
import { LoggingService, HttpClientCervice } from "../services";

class BaseController {
    #logger;
    #httpClient;

    constructor(){
        this.#logger = new LoggingService();
        this.#httpClient = new HttpClientCervice();
    }

    sendLoggingMessage(message: string, type: string) {
        return this.#logger.sendDataInLogging(message, type);
    }

    async postRequest(url, body, options, bearer) {
        return await this.#httpClient.post(url, body, options, bearer);
    }

    async postRequestCloudFuntion(url, body) {
        return await this.#httpClient.postCloudFuntion(url, body);
    }
}

module.exports = BaseController;
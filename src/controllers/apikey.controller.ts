const BaseController = require('./base.controller');

export default class ApiKeyController extends BaseController {

    constructor() {
        super();
    }

    async sendPostRequest(url: string, body: string, options = {}, bearer = '') {
        return await this.postRequest(url, body, options, bearer);
    }

    async sendPostRequestCloudFuntion(url: string, body: string) {
        return await this.postRequestCloudFuntion(url, body);
    }

}
const BaseController = require('./base.controller');

export default class ApiKeyController extends BaseController {
    #url: string;
    #body;
    #options;
    #bearer;

    constructor() {
        super();
        this.#url = '';
        this.#body = {};
        this.#options = {};
        this.#bearer = '';
    }

    setUrl(url: string) {
        return this.#url = url;
    }

    setBody(body) {
        return this.#body = body;
    }

    setOptions(options) {
        return this.#options = options;
    }

    setBearer(bearer: string) {
        return this.#bearer = bearer;
    }

    async sendPostRequest() {
        return await this.postRequest(this.#url, this.#body, this.#options, this.#bearer);
    }

}
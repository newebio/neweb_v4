"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ExpressResponse {
    constructor() {
        this.code = 0;
        this.body = "";
        this.headers = {};
        ExpressResponse.instance = this;
    }
    header(name, value) {
        this.headers[name] = value;
    }
    sendStatus(code) {
        this.code = code;
    }
    status(code) {
        this.code = code;
        return {
            send: (body) => {
                this.body = body;
            },
        };
    }
    getResponse() {
        return {
            statusCode: this.code,
            body: this.body,
            headers: this.headers,
        };
    }
}
exports.default = ExpressResponse;

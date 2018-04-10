"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Socket {
    constructor() {
        this.on = jest.fn();
        this.removeAllListeners = jest.fn();
        this.request = {
            headers: {
                cookie: "sessid=sid1",
            },
            cookies: undefined,
        };
        this.conn = {
            remoteAddress: "127.0." + Math.floor(Math.random() * 254) + "." + Math.floor(Math.random() * 254),
        };
        Socket.instance = this;
    }
}
exports.default = Socket;

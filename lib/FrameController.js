"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const onemitter_1 = require("onemitter");
class FrameController extends onemitter_1.Onemitter {
    constructor(config) {
        super();
        this.config = config;
        this.onInit();
    }
    getInitialData() {
        return this.config.data;
    }
    onInit() {
        //
    }
    dispatch(actionName, ...args) {
        if (this[actionName]) {
            return this[actionName](...args);
        }
        throw new Error("Unknown action " + actionName);
    }
}
exports.default = FrameController;

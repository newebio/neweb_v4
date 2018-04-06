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
    set(value) {
        const currentValue = this.has() ? this.get() : undefined;
        const saved = typeof (value) === "object" ?
            (typeof (currentValue) === "object" ? Object.assign({}, currentValue, value) : value) : value;
        super.emit(saved);
    }
    dispatch(actionName, ...args) {
        if (this[actionName]) {
            return this[actionName](...args);
        }
        throw new Error("Unknown action " + actionName);
    }
    dispose() {
        this.removeAllListeners();
    }
    onChangeParams(_) {
        //
    }
}
exports.default = FrameController;

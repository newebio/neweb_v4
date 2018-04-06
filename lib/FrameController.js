"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const onemitter_1 = require("onemitter");
class FrameController extends onemitter_1.Onemitter {
    constructor(config) {
        super();
        this.config = config;
        this.onInit();
    }
    getInitialData() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.config.data;
        });
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
    dispose() {
        this.removeAllListeners();
    }
    onChangeParams() {
        return __awaiter(this, void 0, void 0, function* () {
            //
        });
    }
}
exports.default = FrameController;

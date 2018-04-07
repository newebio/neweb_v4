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
class SessionContext {
    constructor(config) {
        this.config = config;
        this.data = {};
        Object.keys(this.config.data).map((key) => {
            this.data[key] = onemitter_1.default({ value: this.config.data[key] });
        });
    }
    getItem(name) {
        if (!this.data[name]) {
            this.data[name] = onemitter_1.default();
        }
        return this.data[name];
    }
    setItem(name, value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.data[name]) {
                this.data[name] = onemitter_1.default();
            }
            const data = {};
            Object.keys(this.data).map((key) => {
                if (this.data[key].has()) {
                    data[key] = this.data[key].get();
                }
            });
            yield this.config.onSave(data);
            this.data[name].emit(value);
        });
    }
}
exports.default = SessionContext;

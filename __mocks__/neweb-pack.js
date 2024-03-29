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
exports.page1RootFrame = {
    name: "frames/page1RootFrame/view",
    version: "0.0.5",
    modules: [],
    type: "local",
};
exports.counterFrame = {
    name: "frames/counter/view",
    version: "0.0.6",
    modules: [],
    type: "local",
};
class ModulePacker {
    addLocalPackage(entry) {
        return __awaiter(this, void 0, void 0, function* () {
            if (entry.indexOf("page1RootFrame") > -1) {
                return exports.page1RootFrame;
            }
            if (entry.indexOf("counter") > -1) {
                return exports.counterFrame;
            }
            throw new Error("Unknown entry " + entry);
        });
    }
}
exports.ModulePacker = ModulePacker;

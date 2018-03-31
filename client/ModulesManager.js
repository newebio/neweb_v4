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
const React = require("react");
const ReactDOM = require("react-dom");
const common_1 = require("./../common");
class ModulesManager {
    constructor(config) {
        this.config = config;
        this.modules = [];
        this.modules.push({
            name: "react",
            version: undefined,
            type: "npm",
            content: "",
            exports: React,
        });
        this.modules.push({
            name: "react-dom",
            version: undefined,
            type: "npm",
            content: "",
            exports: ReactDOM,
        });
    }
    preloadModules(modules) {
        return __awaiter(this, void 0, void 0, function* () {
            yield Promise.all(modules.map((mod) => __awaiter(this, void 0, void 0, function* () {
                if (yield this.hasModule(mod.type, mod.name, mod.version)) {
                    return;
                }
                const response = yield fetch(this.config.address + "/" + mod.type + "/"
                    + mod.name.replace(/\//gi, "~") + "/" + mod.version + ".js");
                if (response.status !== 200) {
                    throw new Error("Invalid response::" + (yield response.text()));
                }
                const content = yield response.text();
                yield this.addModule(mod.type, mod.name, mod.version, content);
            })));
        });
    }
    hasModule(type, name, version) {
        return __awaiter(this, void 0, void 0, function* () {
            const mod = this.modules.find((m) => m.type === type && m.name === name && (!version || m.version === version));
            if (mod) {
                return true;
            }
            const content = localStorage.getItem(this.getModuleStorageName(type, name, version));
            if (content) {
                this.modules.push({
                    content,
                    name,
                    type,
                    version,
                    exports: undefined,
                });
                return true;
            }
            return false;
        });
    }
    addModule(type, name, version, content) {
        return __awaiter(this, void 0, void 0, function* () {
            if (yield this.hasModule(type, name, version)) {
                return;
            }
            this.modules.push({
                name,
                version,
                type,
                content,
                exports: undefined,
            });
            localStorage.setItem(this.getModuleStorageName(type, name, version), content);
        });
    }
    loadModule(type, name, version) {
        /*
        const mod = this.modules.find((m) => m.type === type && m.name === name && (!version || m.version === version));
        if (!mod) {
            throw new Error("Not found module " + type + "::" + name + "::" + version);
        }
        const content = localStorage.getItem("__neweb_module_" + type + "~" + name + "~" + version);
        if (content) {
            this.addModule(type, name, version, content);
        }*/
        if (!this.hasModule(type, name, version)) {
            throw new Error("Not found module " + type + "::" + name + "::" + version);
        }
        const mod = this.modules.find((m) => m.type === type && m.name === name && (!version || m.version === version));
        if (!mod) {
            throw new Error("Not found module " + type + "::" + name + "::" + version);
        }
        if (typeof (mod.exports) === "undefined") {
            mod.exports = this.evalModule(mod.content);
        }
        return mod.exports;
    }
    evalModule(content) {
        window[common_1.REQUIRE_FUNC_NAME] = this.loadModule.bind(this);
        // tslint:disable-next-line:no-eval
        return eval(content);
    }
    getModuleStorageName(type, name, version) {
        return "__neweb_module_" + type + "~" + name + "~" + version;
    }
}
exports.default = ModulesManager;

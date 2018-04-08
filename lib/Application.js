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
const fs_1 = require("fs");
const path_1 = require("path");
const util_1 = require("util");
const with_error_1 = require("with-error");
const common_1 = require("../common");
const ClassicRouter_1 = require("./ClassicRouter");
const FrameController_1 = require("./FrameController");
class Application {
    constructor(configuration) {
        this.configuration = configuration;
        this.template = `<!doctype><html>
    <head><title>{%title%}</title>{%meta%}
    <meta charset="utf8" /></head><body>
    <div id="root">{%html%}</div>
    <script>{%script%}</script>
    <script async src="/bundle.js"></script>
    </body></html>`;
        this.environment = "development";
        this.appPath = configuration.appPath;
        this.environment = configuration.environment;
    }
    requireModule(modulePath) {
        return __awaiter(this, void 0, void 0, function* () {
            const { error, result: path } = with_error_1.default(() => require.resolve(path_1.join(this.appPath, modulePath)));
            if (error) {
                return;
            }
            if (this.environment === "development") {
                delete require.cache[path];
            }
            return require(path).default;
        });
    }
    getRouterClass() {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.requireModule("Router")) || ClassicRouter_1.default;
        });
    }
    hasFrame(frameName) {
        return __awaiter(this, void 0, void 0, function* () {
            return util_1.promisify(fs_1.exists)(path_1.resolve(this.appPath, "frames", frameName));
        });
    }
    getContext() {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof (this.context) !== "undefined") {
                return this.context;
            }
            const ContextClass = yield this.requireModule("Context");
            this.context = ContextClass ? new ContextClass({
                config: yield this.getConfig(),
            }) : {};
            return this.context;
        });
    }
    getConfig() {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof (this.config) !== "undefined") {
                return this.config;
            }
            const ConfigClass = yield this.requireModule("Config." + this.environment);
            this.config = ConfigClass ? new ConfigClass() : {};
            return this.config;
        });
    }
    getFrameControllerClass(frameName) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.requireModule("frames/" + frameName + "/controller")) || FrameController_1.default;
        });
    }
    getFrameViewClass(frameName) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.requireModule("frames/" + frameName + "/view")) || (() => null);
        });
    }
    getFrameViewModulePackInfo(frameName) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.configuration.modulePacker.addLocalPackage(path_1.join(this.appPath, "frames", frameName, "view.js"));
        });
    }
    fillTemplate(html, meta, initialInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            const templatePath = path_1.join(this.appPath, "template.html");
            const template = (yield util_1.promisify(fs_1.exists)(templatePath)) ?
                (yield util_1.promisify(fs_1.readFile)(templatePath)).toString()
                : this.template;
            return template
                .replace("{%html%}", html)
                .replace("{%title%}", meta.title || "")
                .replace("{%meta%}", "<!--__page_meta_start__-->" + (meta.meta ? meta.meta.map((m) => `<meta name="${m.name}" content="${m.content}" />`).join("") : "") + "<!--__page_meta_end__-->")
                .replace("{%script%}", `
            window["${common_1.INITIAL_VAR}"]=${JSON.stringify(initialInfo)}
            `);
        });
    }
}
exports.default = Application;

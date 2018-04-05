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
const common_1 = require("../common");
const FrameController_1 = require("./FrameController");
const FramesBasedRouter_1 = require("./FramesBasedRouter");
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
    getRouter() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.environment === "production" && this.router) {
                return this.router;
            }
            const routerConfig = {
                app: this,
                config: yield this.getConfig(),
                context: yield this.getContext(),
            };
            try {
                const routerPath = require.resolve(path_1.join(this.appPath, "Router"));
                if (this.environment === "development") {
                    delete require.cache[routerPath];
                }
                const RouterClass = require(routerPath).default;
                this.router = new RouterClass(routerConfig);
            }
            catch (e) {
                if (!this.router) {
                    this.router = new FramesBasedRouter_1.default(routerConfig);
                }
            }
            return this.router;
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
            try {
                const ContextClass = require(path_1.join(this.appPath, "Context")).default;
                this.context = new ContextClass({
                    config: yield this.getConfig(),
                });
            }
            catch (e) {
                this.context = {};
            }
            return this.context;
        });
    }
    getConfig() {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof (this.config) !== "undefined") {
                return this.config;
            }
            try {
                const ConfigClass = require(path_1.join(this.appPath, "Config." + this.environment)).default;
                this.config = new ConfigClass();
            }
            catch (e) {
                this.config = {};
            }
            return this.config;
        });
    }
    getFrameControllerClass(frameName) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const path = path_1.join(this.appPath, "frames", frameName, "controller");
                if (this.environment === "development") {
                    delete require.cache[path];
                }
                return require(path).default;
            }
            catch (e) {
                return FrameController_1.default;
            }
        });
    }
    getFrameViewClass(frameName) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return require(path_1.join(this.appPath, "frames", frameName, "view")).default;
            }
            catch (e) {
                return () => null;
            }
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

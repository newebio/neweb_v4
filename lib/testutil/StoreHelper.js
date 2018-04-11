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
const neweb_pack_1 = require("neweb-pack");
const common_1 = require("../../common");
const Application_1 = require("./../Application");
const GlobalStore_1 = require("./../GlobalStore");
exports.session1Id = "session1IdValue";
exports.session1Hash = "session1HashValue";
exports.session1Sessid = exports.session1Id + ":" + exports.session1Hash;
class StoreHelper {
    constructor(config) {
        this.config = config;
        this.actions = {
            "new-controller-data": { action: jest.fn() },
            "new-http-request": { action: jest.fn() },
            "new-router-route": { action: jest.fn() },
            "new-socket-connection": { action: jest.fn() },
            "seance-navigate": { action: jest.fn() },
        };
        this.store = new GlobalStore_1.default({
            storePath: __dirname + "/../tmp",
            dataTypes: {
                "session": {
                    lifetime: 1000,
                    persistant: false,
                },
                "session-data": {
                    lifetime: 1000,
                    persistant: false,
                },
                "frame-controller": { lifetime: 1000, persistant: false },
                "frame-controller-data": { lifetime: 1000, persistant: false },
                "seance": { lifetime: 1000, persistant: false },
                "seance-socket": { lifetime: 1000, persistant: false },
                "seance-current-page": { lifetime: 1000, persistant: false },
                "seance-request": { lifetime: 1000, persistant: false },
                "request": { lifetime: 1000, persistant: false },
            },
            objectsTypes: {
                "store": { lifetime: 0 },
                "http-request": {
                    lifetime: 1000,
                },
                "http-response": {
                    lifetime: 1000,
                },
                "app": {
                    lifetime: 1000,
                },
                "frame-controller-object": {
                    lifetime: 1000,
                },
                "socket": {
                    lifetime: 1000,
                },
                "router": {
                    lifetime: 1000,
                },
            },
            actions: this.actions,
        });
    }
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            const modulePacker = new neweb_pack_1.ModulePacker({
                appRoot: this.config.appPath,
                excludedModules: ["react", "react-dom", "neweb"],
                modulesPath: __dirname + "/../tmp",
                REQUIRE_FUNC_NAME: common_1.REQUIRE_FUNC_NAME,
            });
            const app = new Application_1.default({
                environment: "development",
                appPath: this.config.appPath,
                modulePacker: modulePacker,
            });
            yield this.store.setObject("app", "default", {
                type: "object",
                objectType: "store",
                id: "root",
            }, app);
            yield this.store.create("session", exports.session1Id, {
                type: "object",
                objectType: "app",
                id: "default",
            }, { id: exports.session1Id, hash: exports.session1Hash });
            yield this.store.create("session-data", [exports.session1Id, "session1Item1"], {
                type: "data",
                dataType: "session",
                id: exports.session1Id,
            }, "session1Item1Value");
        });
    }
}
exports.default = StoreHelper;

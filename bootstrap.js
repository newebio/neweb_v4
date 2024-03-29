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
const cookieParser = require("cookie-parser");
const express = require("express");
const http_1 = require("http");
const neweb_cli_1 = require("neweb-cli");
const neweb_pack_1 = require("neweb-pack");
const path_1 = require("path");
const SocketIOServer = require("socket.io");
const with_error_1 = require("with-error");
const common_1 = require("./common");
const actions_1 = require("./lib/actions");
const Application_1 = require("./lib/Application");
const GlobalStore_1 = require("./lib/GlobalStore");
const ModulesServer_1 = require("./lib/ModulesServer");
const SessionsStorage_1 = require("./lib/SessionsStorage");
const logger = console;
const appPath = path_1.resolve(path_1.join(process.cwd(), "app"));
const modulesPath = path_1.resolve(path_1.join(appPath, "..", "cache", "modules"));
const environment = process.env.NODE_ENV === "production" ? "production" : "development";
const rawPort = process.env.PORT;
const port = rawPort ? parseInt(rawPort, 10) : 5000;
(() => __awaiter(this, void 0, void 0, function* () {
    const { result: newebConfig } = with_error_1.default(() => require(appPath + "/../neweb.config").default);
    process.on("uncaughtException", (e) => {
        logger.log("uncaughtException", e);
    });
    process.on("unhandledRejection", (e) => {
        logger.log("unhandledRejection", e);
    });
    const expressApp = express();
    const httpServer = http_1.createServer(expressApp);
    const modulePacker = new neweb_pack_1.ModulePacker({
        appRoot: appPath,
        excludedModules: ["react", "react-dom", "neweb"],
        modulesPath,
        REQUIRE_FUNC_NAME: common_1.REQUIRE_FUNC_NAME,
        webpackConfig: newebConfig && newebConfig.webpack ? newebConfig.webpack : {},
    });
    const app = new Application_1.default({
        environment,
        appPath,
        modulePacker,
    });
    const store = new GlobalStore_1.default({
        storePath: __dirname + "/../tmp",
        actions: actions_1.default,
        dataTypes: {
            "session": { lifetime: 1000, persistant: false },
            "session-data": { lifetime: 1000, persistant: false },
            "frame-controller": { lifetime: 1000, persistant: false },
            "frame-controller-data": { lifetime: 1000, persistant: false },
            "seance": { lifetime: 1000, persistant: false },
            "seance-socket": { lifetime: 1000, persistant: false },
            "seance-current-page": { lifetime: 1000, persistant: false },
            "seance-request": { lifetime: 1000, persistant: false },
            "request": { lifetime: 1000, persistant: false },
        },
        objectsTypes: {
            "sessions-storage": { lifetime: 1000 },
            "store": { lifetime: 0 },
            "http-request": { lifetime: 1000 },
            "http-response": { lifetime: 1000 },
            "app": { lifetime: 1000 },
            "frame-controller-object": { lifetime: 1000 },
            "socket": { lifetime: 1000 },
            "router": { lifetime: 1000 },
        },
    });
    yield store.setObject("app", "default", {
        type: "object",
        objectType: "store",
        id: "root",
    }, app);
    // Sessions storage
    yield store.setObject("sessions-storage", "default", {
        type: "object",
        objectType: "store",
        id: "root",
    }, new SessionsStorage_1.default({ sessionsPath: path_1.join(appPath, "..", "sessions") }));
    expressApp.get("/bundle.js", (_, res) => res.sendFile(path_1.resolve(__dirname + "/dist/bundle.js")));
    const modulesServer = new ModulesServer_1.default({
        modulesPath,
    });
    modulesServer.attach(expressApp);
    expressApp.use(express.static(path_1.join(appPath, "public")));
    expressApp.use(cookieParser(), (req, res) => store.dispatch("new-http-request", {
        type: "object",
        objectType: "app",
        id: "default",
    }, {}, {
        request: req,
        response: res,
    }));
    const io = SocketIOServer(httpServer, {
        wsEngine: "ws",
    });
    io.on("connection", yield store.action("new-socket-connection", {
        type: "object",
        objectType: "app",
        id: "default",
    }, {}));
    httpServer.listen(port, (err) => {
        if (err) {
            logger.log(err);
            return;
        }
        logger.log("Started at " + port);
        if (environment === "development") {
            const interactive = new neweb_cli_1.Interactive({
                appPath,
            });
            interactive.start();
        }
    });
}))();

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
const common_1 = require("./common");
const Application_1 = require("./lib/Application");
const ControllersManager_1 = require("./lib/ControllersManager");
const ModulesServer_1 = require("./lib/ModulesServer");
const PageCreator_1 = require("./lib/PageCreator");
const PageRenderer_1 = require("./lib/PageRenderer");
const SeancesManager_1 = require("./lib/SeancesManager");
const Server_1 = require("./lib/Server");
const SessionsManager_1 = require("./lib/SessionsManager");
const SessionsStorage_1 = require("./lib/SessionsStorage");
const logger = console;
const appPath = path_1.resolve(path_1.join(process.cwd(), "app"));
const modulesPath = path_1.resolve(path_1.join(appPath, "..", "cache", "modules"));
const environment = process.env.NODE_ENV === "production" ? "production" : "development";
const port = typeof (process.env.PORT) !== "undefined" ? parseInt(process.env.PORT, 10) : 5000;
(() => __awaiter(this, void 0, void 0, function* () {
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
    });
    const app = new Application_1.default({
        environment,
        appPath,
        modulePacker,
    });
    const pageRenderer = new PageRenderer_1.default({
        app,
    });
    const controllersManager = new ControllersManager_1.default({
        app,
    });
    const sessionsStorage = new SessionsStorage_1.default({
        sessionsPath: path_1.join(appPath, "..", "sessions"),
    });
    const sessionsManager = new SessionsManager_1.default({
        sessionsStorage,
    });
    const pageCreator = new PageCreator_1.default({
        app,
    });
    const seancesManager = new SeancesManager_1.default({
        app,
        controllersManager,
        pageCreator,
        sessionsManager,
    });
    const server = new Server_1.default({
        app,
        logger: console,
        pageRenderer,
        seancesManager,
        sessionsManager,
    });
    expressApp.get("/bundle.js", (_, res) => res.sendFile(path_1.resolve(__dirname + "/dist/bundle.js")));
    const modulesServer = new ModulesServer_1.default({
        modulesPath,
    });
    modulesServer.attach(expressApp);
    expressApp.use(express.static(path_1.join(appPath, "public")));
    expressApp.use(cookieParser(), (req, res) => server.onRequest({
        cookies: req.cookies || {},
        headers: req.headers || {},
        hostname: req.hostname,
        url: req.url,
        clientIpAddress: req.ip,
    }, res));
    const io = SocketIOServer(httpServer, {
        wsEngine: "ws",
    });
    io.on("connection", (socket) => {
        server.onNewConnection(socket);
    });
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

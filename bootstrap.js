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
const neweb_pack_1 = require("neweb-pack");
const path_1 = require("path");
const common_1 = require("./common");
const Application_1 = require("./lib/Application");
const ControllersManager_1 = require("./lib/ControllersManager");
const PageCreator_1 = require("./lib/PageCreator");
const PageRenderer_1 = require("./lib/PageRenderer");
const SeansesManager_1 = require("./lib/SeansesManager");
const Server_1 = require("./lib/Server");
const SessionsDataStorage_1 = require("./lib/SessionsDataStorage");
const SessionsManager_1 = require("./lib/SessionsManager");
const SessionsStorage_1 = require("./lib/SessionsStorage");
const logger = console;
const appPath = path_1.resolve(path_1.join(process.cwd(), "app"));
const environment = process.env.NODE_ENV === "production" ? "production" : "development";
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
(() => __awaiter(this, void 0, void 0, function* () {
    const expressApp = express();
    const httpServer = http_1.createServer(expressApp);
    const modulePacker = new neweb_pack_1.ModulePacker({
        appRoot: appPath,
        excludedModules: ["react", "react-dom"],
        modulesPath: path_1.join(appPath, "cache", "modules"),
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
        sessionsPath: path_1.join(appPath, "sessions"),
    });
    const sessionsDataStorage = new SessionsDataStorage_1.default({
        sessionsStorage,
    });
    const sessionsManager = new SessionsManager_1.default({
        sessionsDataStorage,
        sessionsStorage,
    });
    const pageCreator = new PageCreator_1.default({
        app,
    });
    const seansesManager = new SeansesManager_1.default({
        app,
        controllersManager,
        pageCreator,
        sessionsManager,
    });
    const server = new Server_1.default({
        app,
        pageRenderer,
        seansesManager,
        sessionsManager,
    });
    expressApp.use(cookieParser(), (req, res) => server.onRequest({
        cookies: req.cookies || {},
        headers: req.headers || {},
        hostname: req.hostname,
        url: req.url,
        clientIpAddress: req.ip,
    }, res));
    httpServer.listen(port, (err) => {
        if (err) {
            logger.log(err);
            return;
        }
        logger.log("Started at " + port);
    });
}))();

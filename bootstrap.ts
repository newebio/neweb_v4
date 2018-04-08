import cookieParser = require("cookie-parser");
import express = require("express");
import { createServer } from "http";
import { ModulePacker } from "neweb-pack";
import { join, resolve } from "path";
import SocketIOServer = require("socket.io");
import { REQUIRE_FUNC_NAME } from "./common";
import Application from "./lib/Application";
import ControllersManager from "./lib/ControllersManager";
import ModulesServer from "./lib/ModulesServer";
import PageCreator from "./lib/PageCreator";
import PageRenderer from "./lib/PageRenderer";
import SeancesManager from "./lib/SeancesManager";
import Server from "./lib/Server";
import SessionsManager from "./lib/SessionsManager";
import SessionsStorage from "./lib/SessionsStorage";
const logger = console;
const appPath = resolve(join(process.cwd(), "app"));
const modulesPath = resolve(join(appPath, "..", "cache", "modules"));
const environment = process.env.NODE_ENV === "production" ? "production" : "development";
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
(async () => {
    process.on("uncaughtException", (e) => {
        logger.log("uncaughtException", e);
    });
    process.on("unhandledRejection", (e) => {
        logger.log("unhandledRejection", e);
    });

    const expressApp = express();
    const httpServer = createServer(expressApp);
    const modulePacker = new ModulePacker({
        appRoot: appPath,
        excludedModules: ["react", "react-dom", "neweb"],
        modulesPath,
        REQUIRE_FUNC_NAME,
    });
    const app = new Application({
        environment,
        appPath,
        modulePacker,
    });
    const pageRenderer = new PageRenderer({
        app,
    });
    const controllersManager = new ControllersManager({
        app,
    });
    const sessionsStorage = new SessionsStorage({
        sessionsPath: join(appPath, "..", "sessions"),
    });
    const sessionsManager = new SessionsManager({
        sessionsStorage,
    });
    const pageCreator = new PageCreator({
        app,
    });
    const seancesManager = new SeancesManager({
        app,
        controllersManager,
        pageCreator,
        sessionsManager,
    });
    const server = new Server({
        app,
        logger: console,
        pageRenderer,
        seancesManager,
        sessionsManager,
    });
    expressApp.get("/bundle.js", (_, res) => res.sendFile(resolve(__dirname + "/dist/bundle.js")));
    const modulesServer = new ModulesServer({
        modulesPath,
    });
    modulesServer.attach(expressApp);
    expressApp.use(express.static(join(appPath, "public")));
    expressApp.use(cookieParser(), (req, res) => server.onRequest({
        cookies: req.cookies || {},
        headers: req.headers || {},
        hostname: req.hostname,
        url: req.url,
        clientIpAddress: req.ip,
    }, res));
    const io = SocketIOServer(httpServer as any, {
        wsEngine: "ws",
    } as any);
    io.on("connection", (socket) => {
        server.onNewConnection(socket);
    });
    httpServer.listen(port, (err: any) => {
        if (err) {
            logger.log(err);
            return;
        }
        logger.log("Started at " + port);
    });
})();

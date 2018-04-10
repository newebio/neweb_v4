import cookieParser = require("cookie-parser");
import express = require("express");
import { createServer } from "http";
import { Interactive } from "neweb-cli";
import { ModulePacker } from "neweb-pack";
import { join, resolve } from "path";
import SocketIOServer = require("socket.io");
import { IDataRegistry, IObjectsRegistry } from ".";
import { REQUIRE_FUNC_NAME } from "./common";
import Application from "./lib/Application";
import GlobalStore from "./lib/GlobalStore";
import ModulesServer from "./lib/ModulesServer";
import Server from "./lib/Server";
const logger = console;
const appPath = resolve(join(process.cwd(), "app"));
const modulesPath = resolve(join(appPath, "..", "cache", "modules"));
const environment = process.env.NODE_ENV === "production" ? "production" : "development";
const rawPort = process.env.PORT;
const port = rawPort ? parseInt(rawPort, 10) : 5000;
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
    const store = new GlobalStore<IDataRegistry, IObjectsRegistry>({
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
        },
        objectsTypes: {
            "frame-controller-data-callback": {
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
            "router-route-callback": {
                lifetime: 1000,
            },
            "socket-event-callback": { lifetime: 1000 },
        },
    });
    const server = new Server({
        app,
        logger: console,
        store,
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

        if (environment === "development") {
            const interactive = new Interactive({
                appPath,
            });
            interactive.start();
        }
    });
})();

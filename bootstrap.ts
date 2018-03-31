import cookieParser = require("cookie-parser");
import express = require("express");
import { createServer } from "http";
import { ModulePacker } from "neweb-pack";
import { join, resolve } from "path";
import { REQUIRE_FUNC_NAME } from "./common";
import Application from "./lib/Application";
import ControllersManager from "./lib/ControllersManager";
import PageCreator from "./lib/PageCreator";
import PageRenderer from "./lib/PageRenderer";
import SeansesManager from "./lib/SeansesManager";
import Server from "./lib/Server";
import SessionsDataStorage from "./lib/SessionsDataStorage";
import SessionsManager from "./lib/SessionsManager";
import SessionsStorage from "./lib/SessionsStorage";
const logger = console;
const appPath = resolve(join(process.cwd(), "app"));
const environment = process.env.NODE_ENV === "production" ? "production" : "development";
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
(async () => {
    const expressApp = express();
    const httpServer = createServer(expressApp);
    const modulePacker = new ModulePacker({
        appRoot: appPath,
        excludedModules: ["react", "react-dom"],
        modulesPath: join(appPath, "cache", "modules"),
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
        sessionsPath: join(appPath, "sessions"),
    });
    const sessionsDataStorage = new SessionsDataStorage({
        sessionsStorage,
    });
    const sessionsManager = new SessionsManager({
        sessionsDataStorage,
        sessionsStorage,
    });
    const pageCreator = new PageCreator({
        app,
    });
    const seansesManager = new SeansesManager({
        app,
        controllersManager,
        pageCreator,
        sessionsManager,
    });
    const server = new Server({
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

    httpServer.listen(port, (err: any) => {
        if (err) {
            logger.log(err);
            return;
        }
        logger.log("Started at " + port);
    });
})();

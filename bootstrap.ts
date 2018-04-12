import cookieParser = require("cookie-parser");
import express = require("express");
import { createServer } from "http";
import { Interactive } from "neweb-cli";
import { ModulePacker } from "neweb-pack";
import { join, resolve } from "path";
import SocketIOServer = require("socket.io");
import withError from "with-error";
import { IDataRegistry, IObjectsRegistry, IRegistryActions } from ".";
import { REQUIRE_FUNC_NAME } from "./common";
import actions from "./lib/actions";
import Application from "./lib/Application";
import GlobalStore from "./lib/GlobalStore";
import ModulesServer from "./lib/ModulesServer";
import SessionsStorage from "./lib/SessionsStorage";
const logger = console;
const appPath = resolve(join(process.cwd(), "app"));
const modulesPath = resolve(join(appPath, "..", "cache", "modules"));
const environment = process.env.NODE_ENV === "production" ? "production" : "development";
const rawPort = process.env.PORT;
const port = rawPort ? parseInt(rawPort, 10) : 5000;
(async () => {
    const { result: newebConfig } = withError(() => require(appPath + "/neweb.config").default);
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
        webpackConfig: newebConfig && newebConfig.webpack ? newebConfig.webpack : {},
    });
    const app = new Application({
        environment,
        appPath,
        modulePacker,
    });
    const store = new GlobalStore<IDataRegistry, IObjectsRegistry, IRegistryActions>({
        storePath: __dirname + "/../tmp",
        actions,
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

    await store.setObject("app", "default", {
        type: "object",
        objectType: "store",
        id: "root",
    }, app);
    // Sessions storage
    await store.setObject("sessions-storage", "default", {
        type: "object",
        objectType: "store",
        id: "root",
    }, new SessionsStorage({ sessionsPath: join(appPath, "..", "sessions") }));
    expressApp.get("/bundle.js", (_, res) => res.sendFile(resolve(__dirname + "/dist/bundle.js")));
    const modulesServer = new ModulesServer({
        modulesPath,
    });
    modulesServer.attach(expressApp);
    expressApp.use(express.static(join(appPath, "public")));
    expressApp.use(cookieParser(), (req, res) => store.dispatch("new-http-request", {
        type: "object",
        objectType: "app",
        id: "default",
    }, {}, {
            request: req,
            response: res,
        }));
    const io = SocketIOServer(httpServer as any, {
        wsEngine: "ws",
    } as any);
    io.on("connection", await store.action("new-socket-connection", {
        type: "object",
        objectType: "app",
        id: "default",
    }, {}));
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

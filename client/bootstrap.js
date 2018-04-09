"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SocketIOClient = require("socket.io-client");
const common_1 = require("../common");
const ClientApp_1 = require("./ClientApp");
const ClientModulesManager_1 = require("./ClientModulesManager");
const ClientPageMetaManager_1 = require("./ClientPageMetaManager");
const ClientPageRenderer_1 = require("./ClientPageRenderer");
const ClientSeance_1 = require("./ClientSeance");
const initial = window[common_1.INITIAL_VAR];
const socket = SocketIOClient(window.location.protocol + "//" + window.location.host);
const modulesManager = new ClientModulesManager_1.default({
    address: window.location.protocol + "//" + window.location.host + "/modules",
});
const app = new ClientApp_1.default({
    modulesManager,
});
const pageRenderer = new ClientPageRenderer_1.default({
    app,
    rootHtmlElement: document.getElementById("root"),
});
const pageMetaManager = new ClientPageMetaManager_1.default();
const seance = new ClientSeance_1.default({
    app,
    seanceId: initial.seanceId,
    socket,
    pageRenderer,
    pageMetaManager,
});
const logger = console;
seance.initialize(initial).then(() => {
    window.dispatchEvent(new Event("neweb-seans-initialized"));
    logger.log("Initialized");
});

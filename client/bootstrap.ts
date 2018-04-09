import SocketIOClient = require("socket.io-client");
import { INITIAL_VAR } from "../common";
import { ISeanceDumpInfo } from "./../typings";
import ClientApp from "./ClientApp";
import ClientModulesManager from "./ClientModulesManager";
import ClientPageMetaManager from "./ClientPageMetaManager";
import ClientPageRenderer from "./ClientPageRenderer";
import ClientSeance from "./ClientSeance";

const initial: ISeanceDumpInfo = (window as any)[INITIAL_VAR];
const socket = SocketIOClient(window.location.protocol + "//" + window.location.host);
const modulesManager = new ClientModulesManager({
    address: window.location.protocol + "//" + window.location.host + "/modules",
});
const app = new ClientApp({
    modulesManager,
});
const pageRenderer = new ClientPageRenderer({
    app,
    rootHtmlElement: document.getElementById("root"),
});
const pageMetaManager = new ClientPageMetaManager();
const seance = new ClientSeance({
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

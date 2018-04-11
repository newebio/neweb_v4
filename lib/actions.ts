import { IRegistryActions } from "./..";
import { onNewFrameControllerData } from "./controllers";
import { IGlobalStoreActionResolver } from "./GlobalStore";
import { onHttpRequest } from "./http";
import { navigateSeance, onNewRoute } from "./seances";
import { disconnectSocket, initializeSocket, onNewConnection } from "./sockets";

type ActionsConfig = {[P in keyof IRegistryActions]: IGlobalStoreActionResolver<IRegistryActions, P>};
const actions: ActionsConfig = {
    "new-controller-data": {
        action: (store, params, args) => onNewFrameControllerData(store, params.frameId, args),
    },
    "new-http-request": {
        action: (store, _, args) => onHttpRequest(store, args.request, args.response),
    },
    "new-router-route": {
        action: (store, params, args) => onNewRoute(store, params.seanceId, args),
    },
    "new-socket-connection": {
        action: (store, _, args) => onNewConnection(store, args),
    },
    "seance-navigate": {
        action: (store, params, args) => navigateSeance(store, params.seanceId, args),
    },
    "socket-disconnect": {
        action: (store, params, _) => disconnectSocket(store, params.socketId),
    },
    "socket-error": {
        action: (store, params, _) => disconnectSocket(store, params.socketId),
    },
    "socket-initialize": {
        action: (store, params, args) => initializeSocket(store, params.socketId, args),
    },
    "socket-navigate": {
        action: (store, params, args) => navigateSeance(store, params.seanceId, args.url),
    },
    "socket-recovery": {
        action: (store, params, args) => recoverySocket(store, params, args),
    },
};
export default actions;

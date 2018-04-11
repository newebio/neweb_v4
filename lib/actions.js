"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const controllers_1 = require("./controllers");
const http_1 = require("./http");
const seances_1 = require("./seances");
const sessions_1 = require("./sessions");
const sockets_1 = require("./sockets");
const actions = {
    "new-controller-data": {
        action: (store, params, args) => controllers_1.onNewFrameControllerData(store, params.frameId, args),
    },
    "new-http-request": {
        action: (store, _, args) => http_1.onHttpRequest(store, args.request, args.response),
    },
    "new-router-route": {
        action: (store, params, args) => seances_1.onNewRoute(store, params.seanceId, args),
    },
    "new-socket-connection": {
        action: (store, _, args) => sockets_1.onNewConnection(store, args),
    },
    "seance-navigate": {
        action: (store, params, args) => seances_1.navigateSeance(store, params.seanceId, args),
    },
    "socket-disconnect": {
        action: (store, params, _) => sockets_1.disconnectSocket(store, params.socketId),
    },
    "socket-error": {
        action: (store, params, _) => sockets_1.disconnectSocket(store, params.socketId),
    },
    "socket-initialize": {
        action: (store, params, args) => sockets_1.initializeSocket(store, params.socketId, args),
    },
    "socket-navigate": {
        action: (store, params, args) => seances_1.navigateSeance(store, params.seanceId, args.url),
    },
    "socket-recovery": {
        action: (store, params, args) => sockets_1.recoverySocket(store, params, args),
    },
    "socket-frame-controller-dispatch": {
        action: (store, _, args) => controllers_1.dispatchController(store, args),
    },
    "session-set-data": {
        action: (store, params, args) => sessions_1.sessionSetData(store, params, args),
    },
};
exports.default = actions;

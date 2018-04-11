"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const controllers_1 = require("./../controllers");
const http_1 = require("./../http");
const seances_1 = require("./../seances");
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
        action: (store, params, args) => { },
    },
    "seance-navigate": {
        action: (store, params, args) => seances_1.navigateSeance(store, params.seanceId, args),
    },
};
exports.default = actions;

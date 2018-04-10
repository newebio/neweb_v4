"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const GlobalStore_1 = require("./../GlobalStore");
exports.default = () => new GlobalStore_1.default({
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

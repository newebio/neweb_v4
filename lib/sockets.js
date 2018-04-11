"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const seances_1 = require("./seances");
const sessions_1 = require("./sessions");
const util_1 = require("./util");
const defaultApp = {
    type: "object",
    objectType: "app",
    id: "default",
};
function recoverySocket(store, params) {
    return __awaiter(this, void 0, void 0, function* () {
    });
}
exports.recoverySocket = recoverySocket;
function onNewConnection(store, socket) {
    return __awaiter(this, void 0, void 0, function* () {
        const socketId = generateSocketId();
        yield store.setObject("socket", socketId, defaultApp, socket);
        // Ждем первое сообщение от клиента
        socket.on("initialize", ((store2, socketId2, params, cb) => __awaiter(this, void 0, void 0, function* () {
            yield store2.dispatch("socket-initialize", {
                type: "object",
                objectType: "socket",
                id: socketId2,
            }, { socketId: socketId2 }, params);
            cb();
        })).bind(undefined, store, socketId));
        // Либо сообщение о восстановлении сеанса
        socket.on("recovery", yield store.action("socket-recovery", {
            type: "object",
            objectType: "socket",
            id: socketId,
        }, { socketId }));
        // При разрыве соединения или ошибке
        socket.on("disconnect", yield store.action("socket-disconnect", {
            type: "object",
            objectType: "socket",
            id: socketId,
        }, { socketId }));
        socket.on("error", yield store.action("socket-error", {
            type: "object",
            objectType: "socket",
            id: socketId,
        }, { socketId }));
    });
}
exports.onNewConnection = onNewConnection;
function generateSocketId() {
    return (+new Date()) + Math.round(Math.random() * 100000).toString();
}
function disconnectSocket(store, socketId) {
    return __awaiter(this, void 0, void 0, function* () {
        const socket = yield store.getObject("socket", socketId);
        socket.removeAllListeners();
        yield store.removeObject("socket", socketId);
    });
}
exports.disconnectSocket = disconnectSocket;
function initializeSocket(store, socketId, params) {
    return __awaiter(this, void 0, void 0, function* () {
        const socket = yield store.getObject("socket", socketId);
        // Обогощяем запрос, распарсивая печеньки
        yield util_1.parseRequestCookies(socket.request);
        // create request from socket-info
        const request = {
            clientIpAddress: socket.conn.remoteAddress,
            cookies: socket.request.cookies,
            headers: socket.request.headers,
            url: "",
            hostname: "",
        };
        // get session by request
        const sessionId = yield sessions_1.resolveSessionIdByRequest(store, request);
        const seance = yield store.getMaybe("seance", params.seanceId);
        if (!seance) {
            yield seances_1.restoreSeance();
        }
        else {
            if (seance.sessionId !== sessionId) {
                // TODO log
                return;
            }
            // connect seans to socket
            yield seances_1.connectSeance(store, { socketId, seanceId: params.seanceId, sessionId });
        }
    });
}
exports.initializeSocket = initializeSocket;

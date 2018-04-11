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
const sessions_1 = require("./sessions");
function dispatchController(store, params) {
    return __awaiter(this, void 0, void 0, function* () {
        const controller = yield getController(store, params.frameId);
        if (controller) {
            yield controller.dispatch(params.actionName, ...params.args);
        }
    });
}
exports.dispatchController = dispatchController;
function resolveController(store, params) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!(yield store.has("frame-controller", params.frameId))) {
            yield createController(store, params);
        }
    });
}
exports.resolveController = resolveController;
function getControllerData(store, frameId) {
    return __awaiter(this, void 0, void 0, function* () {
        return store.getMaybe("frame-controller-data", frameId);
    });
}
exports.getControllerData = getControllerData;
function getController(store, frameId) {
    return __awaiter(this, void 0, void 0, function* () {
        return store.getObject("frame-controller-object", frameId);
    });
}
exports.getController = getController;
function disposeController(store, frameId) {
    return __awaiter(this, void 0, void 0, function* () {
        const controller = yield store.getObject("frame-controller-object", frameId);
        yield controller.dispose();
        controller.removeAllListeners();
        yield store.removeObject("frame-controller-object", frameId);
        yield store.remove("frame-controller", frameId);
    });
}
exports.disposeController = disposeController;
function onNewFrameControllerData(store, frameId, value) {
    return __awaiter(this, void 0, void 0, function* () {
        yield store.set("frame-controller-data", frameId, value);
        const controller = yield store.get("frame-controller", frameId);
        const seanceId = controller.seanceId;
        if (yield store.has("seance-socket", seanceId)) {
            const socketId = yield store.get("seance-socket", seanceId);
            if (socketId) {
                if (yield store.hasObject("socket", socketId)) {
                    const socket = yield store.getObject("socket", socketId);
                    socket.emit("frame-controller-data", {
                        frameId,
                        data: value,
                    });
                }
            }
        }
    });
}
exports.onNewFrameControllerData = onNewFrameControllerData;
function createController(store, params) {
    return __awaiter(this, void 0, void 0, function* () {
        const app = yield store.getObject("app", "default");
        const ControllerClass = yield app.getFrameControllerClass(params.frameName);
        yield store.create("frame-controller", params.frameId, {
            type: "data",
            dataType: "seance",
            id: params.seanceId,
        }, {
            seanceId: params.seanceId,
            sessionId: params.sessionId,
            objectId: params.frameId,
        });
        const sessionContext = yield sessions_1.getSessionContext(store, {
            type: "data",
            dataType: "frame-controller",
            id: params.frameId,
        }, params.sessionId);
        const controller = new ControllerClass({
            context: params.context,
            data: undefined,
            navigate: params.navigate,
            params: params.params,
            session: sessionContext,
        });
        yield store.setObject("frame-controller-object", params.frameId, {
            type: "data",
            dataType: "frame-controller",
            id: params.frameId,
        }, controller);
        const data = yield controller.getInitialData();
        controller.emit(data);
        yield store.create("frame-controller-data", params.frameId, {
            type: "data",
            dataType: "frame-controller",
            id: params.frameId,
        }, data);
        // subscribe to controller emitting
        controller.on(yield store.action("new-controller-data", {
            type: "data",
            dataType: "frame-controller",
            id: params.frameId,
        }, { frameId: params.frameId }));
    });
}
exports.createController = createController;

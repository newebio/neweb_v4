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
        controller.off(yield store.getObject("frame-controller-data-callback", frameId));
        yield store.removeObject("frame-controller-object", frameId);
        yield store.removeObject("frame-controller-data-callback", frameId);
    });
}
exports.disposeController = disposeController;
function onNewFrameControllerData(store, frameId, value) {
    return __awaiter(this, void 0, void 0, function* () {
        yield store.set("frame-controller-data", frameId, value);
        const controller = yield store.get("frame-controller", frameId);
        const seanceId = controller.seanceId;
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
    });
}
exports.onNewFrameControllerData = onNewFrameControllerData;
function createController(store, params) {
    return __awaiter(this, void 0, void 0, function* () {
        const app = yield store.getObject("app", "default");
        const ControllerClass = yield app.getFrameControllerClass(params.frameName);
        const controller = new ControllerClass({
            context: params.context,
            data: undefined,
            navigate: params.navigate,
            params: params.params,
            session: params.session,
        });
        yield store.setObject("frame-controller-object", params.frameId, controller);
        const data = yield controller.getInitialData();
        controller.emit(data);
        controller.on(yield store.action("new-controller-data", { frameId: params.frameId }));
        yield store.set("frame-controller", params.frameId, {
            seanceId: params.seanceId,
            sessionId: params.sessionId,
            objectId: params.frameId,
        });
    });
}
exports.createController = createController;

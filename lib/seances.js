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
const isAbsoluteUrl = require("is-absolute-url");
const controllers_1 = require("./controllers");
const PageComparator_1 = require("./PageComparator");
const PageCreator_1 = require("./PageCreator");
const sessions_1 = require("./sessions");
function navigateSeance(store, seanceId, url) {
    return __awaiter(this, void 0, void 0, function* () {
        const router = yield store.getObject("router", seanceId);
        const request = yield store.get("seance-request", seanceId);
        router.navigate({
            request: Object.assign({}, request, { url }),
        });
    });
}
exports.navigateSeance = navigateSeance;
function onNewRoute(store, seanceId, route) {
    return __awaiter(this, void 0, void 0, function* () {
        if (route.type === "redirect") {
            const isAbsolute = isAbsoluteUrl(route.url);
            const socketId = yield store.get("seance-socket", seanceId);
            if (socketId && isAbsolute) {
                const socket = yield store.getObject("socket", socketId);
                socket.emit("redirect", route.url);
                return;
            }
            yield store.dispatch("seance-navigate", {
                type: "data",
                dataType: "seance",
                id: seanceId,
            }, { seanceId }, route.url);
            return;
        }
        if (route.type === "page") {
            yield loadSeancePage(store, seanceId, route.page);
        }
    });
}
exports.onNewRoute = onNewRoute;
function createSeance(store, params) {
    return __awaiter(this, void 0, void 0, function* () {
        const seanceId = params.sessionId + Math.round(Math.random() * 100000).toString();
        yield store.create("seance", seanceId, {
            type: "data",
            dataType: "session",
            id: params.sessionId,
        }, {
            sessionId: params.sessionId,
        });
        yield initializeSeance(store, {
            seanceId,
            sessionId: params.sessionId,
            request: params.request,
        });
        return seanceId;
    });
}
exports.createSeance = createSeance;
function initializeSeance(store, params) {
    return __awaiter(this, void 0, void 0, function* () {
        const app = yield store.getObject("app", "default");
        const RouterClass = yield app.getRouterClass();
        const router = new RouterClass({
            session: yield sessions_1.getSessionContext(store, {
                type: "data",
                dataType: "seance",
                id: params.seanceId,
            }, params.sessionId),
            context: yield app.getContext(),
            request: params.request,
        });
        yield store.create("seance-request", params.seanceId, {
            type: "data",
            dataType: "seance",
            id: params.seanceId,
        }, params.request);
        yield store.setObject("router", params.seanceId, {
            type: "data",
            dataType: "seance",
            id: params.seanceId,
        }, router);
        router.onNewRoute(yield store.action("new-router-route", {
            type: "object",
            objectType: "router",
            id: params.seanceId,
        }, {
            seanceId: params.seanceId,
        }));
    });
}
exports.initializeSeance = initializeSeance;
function loadSeancePage(store, seanceId, routePage) {
    return __awaiter(this, void 0, void 0, function* () {
        if (yield store.has("seance-current-page", seanceId)) {
            yield replaceSeancePage(store, seanceId, routePage);
        }
        else {
            yield createSeancePage(store, seanceId, routePage);
        }
    });
}
exports.loadSeancePage = loadSeancePage;
function createSeancePage(store, seanceId, routePage) {
    return __awaiter(this, void 0, void 0, function* () {
        const pageCreator = new PageCreator_1.default({ app: yield store.getObject("app", "default") });
        const page = yield pageCreator.createPage(routePage);
        yield Promise.all(page.frames.map((frame) => __awaiter(this, void 0, void 0, function* () { return createFrameSeanceController(store, seanceId, frame); })));
        if (routePage.afterLoad) {
            yield routePage.afterLoad(page);
        }
        yield store.create("seance-current-page", seanceId, {
            type: "data",
            dataType: "seance",
            id: seanceId,
        }, page);
    });
}
function createFrameSeanceController(store, seanceId, frame) {
    return __awaiter(this, void 0, void 0, function* () {
        const seance = yield store.get("seance", seanceId);
        const app = yield store.getObject("app", "default");
        yield controllers_1.createController(store, {
            frameId: frame.frameId,
            context: yield app.getContext(),
            frameName: frame.frameName,
            params: frame.params,
            navigate: yield store.action("seance-navigate", {
                type: "data",
                dataType: "seance",
                id: seanceId,
            }, { seanceId }),
            seanceId,
            sessionId: seance.sessionId,
        });
        const data = yield controllers_1.getControllerData(store, frame.frameId);
        frame.data = data;
    });
}
function replaceSeancePage(store, seanceId, routePage) {
    return __awaiter(this, void 0, void 0, function* () {
        const app = yield store.getObject("app", "default");
        const pageCreator = new PageCreator_1.default({
            app,
        });
        const page = yield pageCreator.createPage(routePage);
        const comparator = new PageComparator_1.default();
        const currentPage = yield store.get("seance-current-page", seanceId);
        const info = comparator.getCompareInfo(currentPage, page);
        // TODO not waiting
        yield Promise.all(info.frameidsForRemoving.map((frameId) => __awaiter(this, void 0, void 0, function* () { return controllers_1.disposeController(store, frameId); })));
        yield Promise.all(info.newFrames.map((frame) => __awaiter(this, void 0, void 0, function* () { return createFrameSeanceController(store, seanceId, frame); })));
        yield Promise.all(info.frameForChangeParams.map((frame) => __awaiter(this, void 0, void 0, function* () {
            const controller = yield controllers_1.getController(store, frame.frameId);
            yield controller.onChangeParams(frame.params);
        })));
        if (routePage.afterLoad) {
            yield routePage.afterLoad(info.page);
        }
        yield store.set("seance-current-page", seanceId, info.page);
        const socketId = yield store.get("seance-socket", seanceId);
        if (socketId) {
            if (yield store.hasObject("socket", socketId)) {
                const socket = yield store.getObject("socket", socketId);
                socket.emit("new-page", {
                    page: info.page,
                });
            }
        }
    });
}
function restoreSeance() {
    return __awaiter(this, void 0, void 0, function* () {
        //
    });
}
exports.restoreSeance = restoreSeance;
function connectSeance(store, { seanceId, socketId }) {
    return __awaiter(this, void 0, void 0, function* () {
        yield store.create("seance-socket", seanceId, {
            type: "data",
            dataType: "seance",
            id: seanceId,
        }, socketId);
        const socket = yield store.getObject("socket", socketId);
        const currentPage = yield store.get("seance-current-page", seanceId);
        yield Promise.all(currentPage.frames.map((frame) => __awaiter(this, void 0, void 0, function* () {
            socket.emit("frame-controller-data", {
                frameId: frame.frameId,
                data: yield controllers_1.getControllerData(store, frame.frameId),
            });
        })));
        socket.on("frame-controller-dispatch", ((stor, sockId, params, cb) => __awaiter(this, void 0, void 0, function* () {
            yield stor.dispatch("socket-frame-controller-dispatch", {
                type: "object",
                objectType: "socket",
                id: sockId,
            }, { socketId: sockId }, params);
            cb();
        })).bind(undefined, store, socketId));
        socket.on("navigate", yield store.action("socket-navigate", {
            type: "object",
            objectType: "socket",
            id: socketId,
        }, { seanceId }));
    });
}
exports.connectSeance = connectSeance;

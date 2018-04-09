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
const PageComparator_1 = require("./PageComparator");
class SeanceController {
    constructor(config) {
        this.config = config;
    }
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            const RouterClass = yield this.config.app.getRouterClass();
            this.router = new RouterClass({
                app: this.config.app,
                session: yield this.config.sessionsManager.getSessionContext(this.config.sessionId),
                context: yield this.config.app.getContext(),
                request: this.config.request,
            });
            this.router.onNewRoute((route) => this.onNewRoute(route));
        });
    }
    connect(socket) {
        this.socket = socket;
        this.currentPage.frames.map((frame) => {
            socket.emit("frame-controller-data", {
                frameId: frame.frameId,
                data: this.config.controllersManager.getControllerData(frame.frameId),
            });
        });
        socket.on("frame-controller-dispatch", (params, cb) => __awaiter(this, void 0, void 0, function* () {
            const controller = yield this.config.controllersManager.getController(params.frameId);
            if (controller) {
                yield controller.dispatch(params.actionName, ...params.args);
                cb();
            }
        }));
        socket.on("navigate", ({ url }) => __awaiter(this, void 0, void 0, function* () {
            yield this.navigate(url);
        }));
    }
    disconnect() {
        this.socket = undefined;
    }
    navigate(url) {
        return __awaiter(this, void 0, void 0, function* () {
            this.router.navigate({
                request: Object.assign({}, this.config.request, { url }),
            });
        });
    }
    loadPage(routePage) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.currentPage) {
                yield this.replacePage(routePage);
            }
            else {
                this.currentPage = yield this.createPage(routePage);
            }
        });
    }
    dumpToJson() {
        return {
            seanceId: this.config.seanceId,
            page: this.currentPage,
        };
    }
    onNewRoute(route) {
        return __awaiter(this, void 0, void 0, function* () {
            if (route.type === "redirect") {
                const isAbsolute = isAbsoluteUrl(route.url);
                if (this.socket && isAbsolute) {
                    this.socket.emit("redirect", route.url);
                    return;
                }
                this.navigate(route.url);
                return;
            }
            if (route.type === "page") {
                yield this.loadPage(route.page);
            }
        });
    }
    replacePage(routePage) {
        return __awaiter(this, void 0, void 0, function* () {
            const page = yield this.config.pageCreator.createPage(routePage);
            const comparator = new PageComparator_1.default();
            const info = comparator.getCompareInfo(this.currentPage, page);
            // TODO not waiting
            info.frameidsForRemoving.map((frameId) => this.config.controllersManager.dispose(frameId));
            yield Promise.all(info.newFrames.map((frame) => __awaiter(this, void 0, void 0, function* () { return this.createController(frame); })));
            yield Promise.all(info.frameForChangeParams.map((frame) => __awaiter(this, void 0, void 0, function* () {
                const controller = this.config.controllersManager.getController(frame.frameId);
                yield controller.onChangeParams(frame.params);
            })));
            this.currentPage = info.page;
            if (routePage.afterLoad) {
                yield routePage.afterLoad(this.currentPage);
            }
            if (this.socket) {
                this.socket.emit("new-page", {
                    page: info.page,
                });
            }
        });
    }
    createPage(routePage) {
        return __awaiter(this, void 0, void 0, function* () {
            const page = yield this.config.pageCreator.createPage(routePage);
            yield Promise.all(page.frames.map((frame) => __awaiter(this, void 0, void 0, function* () { return this.createController(frame); })));
            if (routePage.afterLoad) {
                yield routePage.afterLoad(page);
            }
            return page;
        });
    }
    createController(frame) {
        return __awaiter(this, void 0, void 0, function* () {
            const controller = yield this.config.controllersManager.createController({
                frameId: frame.frameId,
                session: yield this.config.sessionsManager.getSessionContext(this.config.sessionId),
                context: yield this.config.app.getContext(),
                frameName: frame.frameName,
                params: frame.params,
                navigate: (url) => this.navigate(url),
                seanceId: this.config.seanceId,
                sessionId: this.config.sessionId,
            });
            const data = yield this.config.controllersManager.getControllerData(frame.frameId);
            frame.data = data;
            controller.on((value) => {
                if (this.socket) {
                    this.socket.emit("frame-controller-data", {
                        frameId: frame.frameId,
                        data: value,
                    });
                }
            });
        });
    }
}
exports.default = SeanceController;

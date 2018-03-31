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
class SeanceController {
    constructor(config) {
        this.config = config;
    }
    navigate(_) {
        return __awaiter(this, void 0, void 0, function* () {
            /*const route = await router.resolve({
                request: {
                    ...this.config.request,
                    url,
                },
                session: await this.config.sessionsManager.getSessionContext(this.config.sessionId),
            });
            if (route.type === "page") {
                await this.loadPage(route.page);
            }
            return route;*/
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
    replacePage(_) {
        return __awaiter(this, void 0, void 0, function* () {
            // TODO
        });
    }
    createPage(routePage) {
        return __awaiter(this, void 0, void 0, function* () {
            const page = yield this.config.pageCreator.createPage(routePage);
            yield Promise.all(page.frames.map((frame) => __awaiter(this, void 0, void 0, function* () {
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
                const data = yield controller.getInitialData();
                frame.data = data;
            })));
            return page;
        });
    }
}
exports.default = SeanceController;

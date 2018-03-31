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
class PageCreator {
    constructor(config) {
        this.config = config;
        this.nonce = 0;
    }
    createPage(routePage) {
        return __awaiter(this, void 0, void 0, function* () {
            const frames = this.collectFrames(routePage.rootFrame);
            const pageFrames = yield Promise.all(frames.allFrames
                .map((frame) => this.createFrame(frame.frameId, frame.frame, frame.frames)));
            let modules = [];
            yield Promise.all(frames.allFrames.map((frame) => __awaiter(this, void 0, void 0, function* () {
                modules = modules.concat(yield this.config.app.getFrameModules(frame.frame.name));
            })));
            return {
                frames: pageFrames,
                rootFrame: frames.frameId,
                modules,
            };
        });
    }
    getFrameModules(frameName) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.config.app.getFrameModules(frameName);
        });
    }
    createFrame(frameId, routePageFrame, children) {
        return __awaiter(this, void 0, void 0, function* () {
            const frameName = routePageFrame.name;
            const data = null;
            const params = routePageFrame.params;
            return {
                frameId,
                frameName,
                frames: children,
                data,
                params,
            };
        });
    }
    generateFrameId() {
        return (+new Date()).toString() + Math.round(Math.random() * 10000).toString() + ++this.nonce;
    }
    collectFrames(routePageFrame) {
        const frameId = this.generateFrameId();
        let allFrames = [];
        const frames = {};
        Object.keys(routePageFrame.frames).map((framePlace) => {
            const childFrame = this.collectFrames(routePageFrame.frames[framePlace]);
            frames[framePlace] = childFrame.frameId;
            allFrames = allFrames.concat(childFrame.allFrames);
        });
        allFrames.unshift({
            frameId,
            frame: routePageFrame,
            frames,
        });
        return {
            frameId,
            frame: routePageFrame,
            frames,
            allFrames,
        };
    }
}
exports.default = PageCreator;

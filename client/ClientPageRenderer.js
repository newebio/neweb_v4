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
const onemitter_1 = require("onemitter");
const React = require("react");
const ReactDOM = require("react-dom");
const ReactOnemitter_1 = require("./ReactOnemitter");
const RootComponent_1 = require("./RootComponent");
class ClientPageRenderer {
    constructor(config) {
        this.config = config;
        this.rootChildrenEmitter = onemitter_1.default();
        this.frames = {};
        this.rootElement = React.createElement(RootComponent_1.default, {
            children: this.rootChildrenEmitter,
        });
    }
    loadPage(page) {
        return __awaiter(this, void 0, void 0, function* () {
            yield Promise.all(page.frames.map((f) => this.createFrame(f)));
            this.renderFrame(page.rootFrame);
            this.currentPage = page;
        });
    }
    hydrate() {
        return new Promise((resolve) => {
            this.rootChildrenEmitter.emit(this.frames[this.currentPage.rootFrame].element);
            ReactDOM.hydrate(this.rootElement, this.config.rootHtmlElement, resolve);
        });
    }
    renderFrame(pageFrameId) {
        const frame = this.frames[pageFrameId];
        const places = {};
        Object.keys(frame.frame.frames).map((framePlace) => {
            const childFrameId = frame.frame.frames[framePlace];
            this.renderFrame(childFrameId);
            places[framePlace] = this.frames[childFrameId].element;
        });
        frame.propsEmitter.emit(Object.assign({}, frame.propsEmitter.get(), { places }));
    }
    createFrame(pageFrame) {
        return __awaiter(this, void 0, void 0, function* () {
            const ViewClass = yield this.config.app.getFrameViewClass(pageFrame);
            const data = pageFrame.data;
            const params = pageFrame.params;
            const props = { data, params };
            const propsEmitter = onemitter_1.default({ value: props });
            this.frames[pageFrame.frameId] = {
                propsEmitter,
                element: React.createElement(ReactOnemitter_1.default, {
                    key: pageFrame.frameId,
                    componentEmitter: onemitter_1.default({ value: ViewClass }),
                    propsEmitter,
                }),
                frame: pageFrame,
            };
        });
    }
}
exports.default = ClientPageRenderer;

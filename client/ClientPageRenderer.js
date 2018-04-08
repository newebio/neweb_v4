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
const NavigateContext_1 = require("./NavigateContext");
const ReactOnemitter_1 = require("./ReactOnemitter");
const RootComponent_1 = require("./RootComponent");
class ClientPageRenderer {
    constructor(config) {
        this.config = config;
        this.rootChildrenEmitter = onemitter_1.default();
        this.frames = {};
    }
    loadPage(page) {
        return __awaiter(this, void 0, void 0, function* () {
            yield Promise.all(page.frames.map((f) => this.createFrame(f)));
            this.renderFrame(page.rootFrame);
            this.currentPage = page;
        });
    }
    newPage(page) {
        return __awaiter(this, void 0, void 0, function* () {
            yield Promise.all(page.frames.map((frame) => __awaiter(this, void 0, void 0, function* () {
                if (!this.frames[frame.frameId]) {
                    yield this.createFrame(frame);
                }
                else {
                    this.updateFrame(frame);
                }
            })));
            // TODO delete old frames
            this.renderFrame(page.rootFrame);
            this.rootChildrenEmitter.emit(this.frames[page.rootFrame].element);
            this.currentPage = page;
        });
    }
    setMethods(params) {
        this.navigate = params.navigate;
        this.dispatch = params.dispatch;
        this.seansStatusEmitter = params.seansStatusEmitter;
        this.networkStatusEmitter = params.networkStatusEmitter;
        this.historyContext = params.historyContext;
    }
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            this.rootElement = React.createElement(RootComponent_1.default, {
                children: this.rootChildrenEmitter,
                seansStatusEmitter: this.seansStatusEmitter,
                networkStatusEmitter: this.networkStatusEmitter,
                historyContext: this.historyContext,
            });
            return new Promise((resolve) => {
                this.rootChildrenEmitter.emit(this.frames[this.currentPage.rootFrame].element);
                ReactDOM.hydrate(React.createElement(NavigateContext_1.default.Provider, {
                    value: this.navigate,
                    children: this.rootElement,
                }), this.config.rootHtmlElement, resolve);
            });
        });
    }
    emitFrameControllerData(params) {
        if (this.frames[params.frameId]) {
            this.frames[params.frameId].propsEmitter.emit(Object.assign({}, this.frames[params.frameId].propsEmitter.get(), { data: params.data }));
        }
    }
    renderFrame(pageFrameId) {
        const frame = this.frames[pageFrameId];
        const places = {};
        Object.keys(frame.frame.frames).map((framePlace) => {
            const childFrameId = frame.frame.frames[framePlace];
            this.renderFrame(childFrameId);
            places[framePlace] = this.frames[childFrameId].element;
        });
        const oldProps = frame.propsEmitter.get();
        const newProps = {};
        Object.keys(oldProps).map((propName) => {
            if (propName === "data" || propName === "params" || propName === "dispatch" || propName === "navigate") {
                newProps[propName] = oldProps[propName];
            }
            else if (places[propName]) {
                newProps[propName] = places[propName];
            }
            else {
                newProps[propName] = undefined;
            }
        });
        frame.propsEmitter.emit(Object.assign({}, newProps, places));
    }
    updateFrame(pageFrame) {
        return __awaiter(this, void 0, void 0, function* () {
            const oldFrame = this.frames[pageFrame.frameId];
            const props = {};
            if (JSON.stringify(oldFrame.frame.params) !== JSON.stringify(pageFrame.params)) {
                oldFrame.frame.params = pageFrame.params;
                props.params = pageFrame.params;
            }
            oldFrame.propsEmitter.emit(Object.assign({}, oldFrame.propsEmitter.get(), props));
            oldFrame.frame.frames = pageFrame.frames;
        });
    }
    createFrame(pageFrame) {
        return __awaiter(this, void 0, void 0, function* () {
            const ViewClass = yield this.config.app.getFrameViewClass(pageFrame);
            const data = pageFrame.data;
            const params = pageFrame.params;
            const props = {
                data,
                params,
                navigate: this.navigate,
                dispatch: (actionName, ...args) => this.dispatch({
                    frameId: pageFrame.frameId,
                    actionName,
                    args,
                }),
            };
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

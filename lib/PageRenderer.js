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
const React = require("react");
// tslint:disable-next-line:no-submodule-imports
const ReactDOMServer = require("react-dom/server");
class PageRenderer {
    constructor(config) {
        this.config = config;
    }
    render(page) {
        return __awaiter(this, void 0, void 0, function* () {
            let el;
            const data = [];
            const frames = [...page.frames];
            for (const pageFrame of frames.reverse()) {
                el = yield this.renderFrame(pageFrame, el);
                data.push(pageFrame.data);
            }
            return {
                html: ReactDOMServer.renderToString(el),
                data: data.reverse(),
            };
        });
    }
    renderFrame(frame, children) {
        return __awaiter(this, void 0, void 0, function* () {
            const ViewClass = yield this.config.app.getFrameViewClass(frame.frameName);
            return React.createElement(ViewClass, { params: frame.params, data: frame.data, children });
        });
    }
}
exports.default = PageRenderer;

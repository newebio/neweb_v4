import React = require("react");
// tslint:disable-next-line:no-submodule-imports
import ReactDOMServer = require("react-dom/server");
import SeansStatusContext from "./../client/SeansStatusContext";
import { IApplication, IPage, IPageFrame } from "./../typings";
export interface IServerRendererConfig {
    app: IApplication;
}
class PageRenderer {
    constructor(protected config: IServerRendererConfig) {

    }
    public async render(page: IPage) {
        let el: any;
        const frames = [...page.frames];
        for (const pageFrame of frames.reverse()) {
            el = await this.renderFrame(pageFrame, el);
        }
        return ReactDOMServer.renderToString(el);
    }
    protected async renderFrame(frame: IPageFrame, children: any) {
        const ViewClass = await this.config.app.getFrameViewClass(frame.frameName);
        return React.createElement(SeansStatusContext.Provider, {
            value: "initializing",
            children: React.createElement(ViewClass, { params: frame.params, data: frame.data, children }),
        });
    }
}
export default PageRenderer;

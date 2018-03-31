import { IPackInfoModule } from "neweb-pack";
import { IApplication, IPage, IPageFrame, IRoutePage, IRoutePageFrame } from "../typings";
export interface IPageCreatorConfig {
    app: IApplication;
}
class PageCreator {
    protected nonce = 0;
    constructor(protected config: IPageCreatorConfig) {

    }
    public async createPage(routePage: IRoutePage): Promise<IPage> {
        const frames = this.collectFrames(routePage.rootFrame);
        const pageFrames = await Promise.all(frames.allFrames
            .map((frame) => this.createFrame(frame.frameId, frame.frame, frame.frames)));
        const modules: IPackInfoModule[] = [];
        return {
            frames: pageFrames,
            rootFrame: frames.frameId,
            modules,
        };
    }
    protected async createFrame(
        frameId: string, routePageFrame: IRoutePageFrame,
        children: { [index: string]: string }): Promise<IPageFrame> {
        const frameName = routePageFrame.name;
        const data = null;
        const params = routePageFrame.params;
        const packInfo = await this.config.app.getFrameViewModulePackInfo(frameName);
        return {
            frameId,
            frameName,
            frameVersion: packInfo.version,
            modules: packInfo.modules.concat([{ name: packInfo.name, type: packInfo.type, version: packInfo.version }]),
            frames: children,
            data,
            params,
        };
    }
    protected generateFrameId() {
        return (+new Date()).toString() + Math.round(Math.random() * 10000).toString() + ++this.nonce;
    }
    protected collectFrames(routePageFrame: IRoutePageFrame) {
        const frameId = this.generateFrameId();
        let allFrames: Array<{
            frameId: string;
            frame: IRoutePageFrame;
            frames: { [index: string]: string };
        }> = [];
        const frames: { [index: string]: string } = {};
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
export default PageCreator;

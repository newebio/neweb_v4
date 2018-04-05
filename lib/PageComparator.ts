import { IPage, IPageFrame } from "..";
interface IReplacePageInfo {
    page: IPage;
    oldPage: IPage;
    newFrames: IPageFrame[];
    frames: IPageFrame[];
    frameidsForRemoving: string[];
    frameForChangeParams: Array<{
        frameId: string;
        params: any;
    }>;
}
class PageComparator {
    public getCompareInfo(oldPage: IPage, newPage: IPage) {
        const replacePageInfo: IReplacePageInfo = {
            page: newPage,
            oldPage,
            newFrames: [],
            frameForChangeParams: [],
            frameidsForRemoving: [],
            frames: [],
        };
        const oldFramesByPaths = collectFramesByPath(oldPage);
        const rootFrame = this.processFrame(
            replacePageInfo, oldFramesByPaths, newPage, newPage.rootFrame, "_root");
        const newFramesIds = replacePageInfo.frames.map((f) => f.frameId);
        const oldFramesIds = oldPage.frames.map((f) => f.frameId);

        replacePageInfo.frameidsForRemoving = oldFramesIds.filter((f) =>
            newFramesIds.indexOf(f) === -1,
        );

        replacePageInfo.page = {
            frames: replacePageInfo.frames,
            modules: newPage.modules,
            meta: newPage.meta,
            title: newPage.title,
            url: newPage.url,
            rootFrame,
        };

        return replacePageInfo;
    }
    protected processFrame(
        replacePageInfo: IReplacePageInfo,
        oldFramesByPaths: { [index: string]: { frameId: string } },
        newPage: IPage, frameId: string, pathName: string) {
        const newFrame = getFrameById(newPage, frameId);
        const framePath = pathName + "/$" + newFrame.frameName;
        const oldFrameByPath = oldFramesByPaths[framePath];
        if (oldFrameByPath) {
            const oldFrame = getFrameById(replacePageInfo.oldPage, oldFrameByPath.frameId);
            const childFrames: { [index: string]: string } = {};
            if (JSON.stringify(oldFrame.params) !== JSON.stringify(newFrame.params)) {
                replacePageInfo.frameForChangeParams.push({ frameId: oldFrame.frameId, params: newFrame.params });
            }
            Object.keys(newFrame.frames).map((placeName) => {
                childFrames[placeName] = this.processFrame(
                    replacePageInfo, oldFramesByPaths, newPage, newFrame.frames[placeName], framePath + "/"
                    + "_" + placeName);
            });
            const xFrame: IPageFrame = {
                frameId: oldFrame.frameId,
                frameName: newFrame.frameName,
                data: newFrame.data,
                frames: childFrames,
                frameVersion: newFrame.frameVersion,
                modules: newFrame.modules,
                params: newFrame.params,
            };
            replacePageInfo.frames.push(xFrame);
            return xFrame.frameId;
        } else {
            const childFrames: { [index: string]: string } = {};
            Object.keys(newFrame.frames).map((placeName) => {
                childFrames[placeName] = this.processFrame(
                    replacePageInfo, oldFramesByPaths, newPage, newFrame.frames[placeName], framePath + "/"
                    + "_" + placeName);
            });
            const xFrame = { ...newFrame, frames: childFrames };
            replacePageInfo.frames.push(xFrame);
            replacePageInfo.newFrames.push(xFrame);
            return xFrame.frameId;
        }
    }
}

export function collectFramesByPath(page: IPage): { [index: string]: { frameId: string } } {
    const rootFrame = getFrameById(page, page.rootFrame);
    const frames = collectFramesForFrame(page, rootFrame, "_root/$" + rootFrame.frameName);
    return { ...frames, ["_root/$" + rootFrame.frameName]: { frameId: page.rootFrame } };
}
export function collectFramesForFrame(page: IPage, frame: IPageFrame, path: string) {
    const frames: { [index: string]: { frameId: string } } = {};
    Object.keys(frame.frames).map((placeName) => {
        const childFrame = getFrameById(page, frame.frames[placeName]);
        const childPath = path + "/_" + placeName + "/$" + childFrame.frameName;
        frames[childPath] = { frameId: childFrame.frameId };
        collectFramesForFrame(page, childFrame, childPath);
    });
    return frames;
}
export function getFrameById(page: IPage, frameId: string) {
    const frame = page.frames.find((f) => f.frameId === frameId);
    if (!frame) {
        throw new Error("Not found frame " + frameId);
    }
    return frame;
}
export default PageComparator;

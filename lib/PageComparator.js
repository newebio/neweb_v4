"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class PageComparator {
    getCompareInfo(oldPage, newPage) {
        const replacePageInfo = {
            page: newPage,
            oldPage,
            newFrames: [],
            frameForChangeParams: [],
            frameidsForRemoving: [],
            frames: [],
        };
        const rootFrame = this.replaceFrame(replacePageInfo, newPage.rootFrame, oldPage.rootFrame).frameId;
        replacePageInfo.page.rootFrame = rootFrame;
        replacePageInfo.page.frames = replacePageInfo.frames;
        return replacePageInfo;
    }
    collectAllChildrenFrames(page, frame) {
        let frames = [];
        Object.keys(frame.frames).map((placeName) => {
            const childFrame = page.frames.find((f) => frame.frames[placeName] === f.frameId);
            frames.push(childFrame);
            frames = frames.concat(this.collectAllChildrenFrames(page, childFrame));
        });
        return frames;
    }
    replaceFrame(replacePageInfo, newFrameId, oldFrameId) {
        const page = replacePageInfo.page;
        const newFrame = page.frames.find((f) => f.frameId === newFrameId);
        const oldFrame = replacePageInfo.oldPage.frames.find((f) => f.frameId === oldFrameId);
        if (newFrame.frameName !== oldFrame.frameName) {
            replacePageInfo.frameidsForRemoving.push(oldFrame.frameId);
            replacePageInfo.frameidsForRemoving = replacePageInfo.frameidsForRemoving
                .concat(this.collectAllChildrenFrames(replacePageInfo.oldPage, oldFrame).map((f) => f.frameId));
            const childNewFrames = this.collectAllChildrenFrames(page, newFrame);
            replacePageInfo.newFrames.push(newFrame);
            replacePageInfo.newFrames = replacePageInfo.newFrames.concat(childNewFrames);
            // collect all old frame id
            // collect all new frame id
            replacePageInfo.frames.push(newFrame);
            replacePageInfo.frames = replacePageInfo.frames.concat(childNewFrames);
            return newFrame;
        }
        else {
            const frames = {};
            Object.keys(newFrame.frames).map((placeName) => {
                if (!oldFrame.frames[placeName]) {
                    frames[placeName] = newFrame.frames[placeName];
                }
                else {
                    const replacedFrame = this.replaceFrame(replacePageInfo, newFrame.frames[placeName], oldFrame.frames[placeName]);
                    frames[placeName] = replacedFrame.frameId;
                }
            });
            const xFrame = Object.assign({}, oldFrame, { frames });
            if (JSON.stringify(newFrame.params) !== JSON.stringify(oldFrame.params)) {
                replacePageInfo.frameForChangeParams.push({
                    frameId: oldFrame.frameId,
                    params: newFrame.params,
                });
                xFrame.params = newFrame.params;
            }
            replacePageInfo.frames.push(xFrame);
            return xFrame;
        }
    }
}
exports.default = PageComparator;

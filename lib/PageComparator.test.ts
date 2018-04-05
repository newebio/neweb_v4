import { IPage, IPageFrame } from "..";
import PageComparator from "./PageComparator";

describe("PageComparator", () => {
    it("change one root frame to another", () => {
        const comparator = new PageComparator();
        const oldPage: IPage = {
            rootFrame: "1",
            frames: [{
                frameId: "1",
                frameName: "frame1",
                data: {},
                frames: {},
                frameVersion: "0.1",
                modules: [],
                params: {},
            }],
            modules: [],
            url: "/",
        };
        const frame2: IPageFrame = {
            frameId: "2",
            frameName: "frame2",
            data: {},
            frames: {},
            frameVersion: "0.1",
            modules: [],
            params: {},
        };
        const newPage: IPage = {
            rootFrame: "2",
            frames: [frame2],
            url: "/",
            modules: [],
        };
        const info = comparator.getCompareInfo(oldPage, newPage);
        expect(info.frames).toEqual([frame2]);
        expect(info.frameForChangeParams).toEqual([]);
        expect(info.page).toEqual(newPage);
        expect(info.frameidsForRemoving).toEqual(["1"]);
    });
    it("add third level to frames", () => {
        const comparator = new PageComparator();
        const frame1 = {
            frameId: "1",
            frameName: "frame1",
            data: {},
            frames: { children: "2" },
            frameVersion: "0.1",
            modules: [],
            params: {},
        };
        const frame2: IPageFrame = {
            frameId: "2",
            frameName: "frame2",
            data: {},
            frames: {},
            frameVersion: "0.1",
            modules: [],
            params: {},
        };
        const frame3: IPageFrame = {
            frameId: "3",
            frameName: "frame3",
            data: {},
            frames: {},
            frameVersion: "0.3",
            modules: [],
            params: {},
        };
        const oldPage: IPage = {
            rootFrame: "1",
            frames: [frame1, frame2],
            modules: [],
            url: "/",
        };

        const newFrame2 = { ...frame2, frameId: "111", frames: { children: "3" } };
        const newPage: IPage = {
            rootFrame: "1",
            frames: [{ ...frame1, frames: { children: "111" } }, newFrame2, frame3],
            modules: [],
            url: "/",
        };
        const info = comparator.getCompareInfo(oldPage, newPage);
        expect(info.frames.length).toBe(3);
        expect(info.frames).toContainEqual(frame1);
        expect(info.frames).toContainEqual({ ...newFrame2, frameId: frame2.frameId });
        expect(info.frames).toContainEqual(frame3);
        expect(info.newFrames.length).toBe(1);
        expect(info.newFrames).toContainEqual(frame3);
    });
});

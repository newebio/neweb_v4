import FrameController from "./FrameController";

describe("FrameController", () => {
    it("set", () => {
        const controller = new FrameController<any, {
            test: number;
            test2: number;
        }, any>({
            context: {},
            navigate: jest.fn(),
            params: {},
            session: {} as any,
        });
        controller.set({ test: 1, test2: 2 });
        expect(controller.get()).toEqual({ test: 1, test2: 2 });
        controller.set({ test2: 3 });
        expect(controller.get()).toEqual({ test: 1, test2: 3 });
    });
});

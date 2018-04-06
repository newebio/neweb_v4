"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const FrameController_1 = require("./FrameController");
describe("FrameController", () => {
    it("set", () => {
        const controller = new FrameController_1.default({
            context: {},
            navigate: jest.fn(),
            params: {},
            session: {},
        });
        controller.set({ test: 1, test2: 2 });
        expect(controller.get()).toEqual({ test: 1, test2: 2 });
        controller.set({ test2: 3 });
        expect(controller.get()).toEqual({ test: 1, test2: 3 });
    });
});

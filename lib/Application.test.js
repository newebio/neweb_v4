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
const controller_1 = require("./../__fixtures__/app/frames/frame1/controller");
const Application_1 = require("./Application");
const FrameController_1 = require("./FrameController");
describe("Application:tests", () => {
    const appPath = __dirname + "/../__fixtures__/app";
    const modulePacker = {
        addLocalPackage: jest.fn(),
    };
    let app;
    beforeEach(() => {
        modulePacker.addLocalPackage = jest.fn();
        app = new Application_1.default({
            appPath,
            environment: "development",
            modulePacker,
        });
    });
    it("requireModule should return default exports of module by path", () => __awaiter(this, void 0, void 0, function* () {
        expect((yield app.requireModule("module1"))()).toBe("testDefaultExport1");
    }));
    it("requireModule should return undefined when module non-exists", () => __awaiter(this, void 0, void 0, function* () {
        expect(yield app.requireModule("test" + Math.random())).toBeUndefined();
    }));
    it("getFrameControllerClass should return FrameController when class not found", () => __awaiter(this, void 0, void 0, function* () {
        const ControllerClass = yield app.getFrameControllerClass("frame" + Math.random());
        expect(ControllerClass).toBe(FrameController_1.default);
    }));
    it("getFrameControllerClass should return class of Controller when class found", () => __awaiter(this, void 0, void 0, function* () {
        const ControllerClass = yield app.getFrameControllerClass("frame1");
        expect(ControllerClass).toBe(controller_1.default);
    }));
});

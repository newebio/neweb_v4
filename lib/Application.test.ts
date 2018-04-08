import Frame1Controller from "./../__fixtures__/app/frames/frame1/controller";
import Application from "./Application";
import FrameController from "./FrameController";
describe("Application:tests", () => {
    const appPath = __dirname + "/../__fixtures__/app";
    const modulePacker = {
        addLocalPackage: jest.fn(),
    };
    let app: Application;
    beforeEach(() => {
        modulePacker.addLocalPackage = jest.fn();
        app = new Application({
            appPath,
            environment: "development",
            modulePacker,
        });
    });
    it("requireModule should return default exports of module by path", async () => {
        expect((await app.requireModule("test"))()).toBe("testDefaultExport1");
    });
    it("requireModule should return undefined when module non-exists", async () => {
        expect(await app.requireModule("test" + Math.random())).toBeUndefined();
    });
    it("getFrameControllerClass should return FrameController when class not found", async () => {
        const ControllerClass = await app.getFrameControllerClass("frame" + Math.random());
        expect(ControllerClass).toBe(FrameController);
    });
    it("getFrameControllerClass should return class of Controller when class found", async () => {
        const ControllerClass = await app.getFrameControllerClass("frame1");
        expect(ControllerClass).toBe(Frame1Controller);
    });
});

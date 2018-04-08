import SessionContext from "./SessionContext";

describe("SessionContext", () => {
    let onSave: jest.Mock<any>;
    beforeEach(() => {
        onSave = jest.fn();
    });
    it("getItem::when item not existing, should create onemitter", () => {
        const data = {};
        const context = new SessionContext({
            data,
            onSave,
        });
        expect(context.getItem("test").has()).toBe(false);
    });
    it("getItem::when item created by inited data, should return value", () => {
        const context = new SessionContext({
            data: { test: "value1" },
            onSave,
        });
        expect(context.getItem("test").get()).toBe("value1");
    });
    it(`setItem::when item not existing, should create onemitter and call onSave with all data`, async () => {
        const context = new SessionContext({
            data: { test2: "value2" },
            onSave,
        });
        await context.setItem("test3", "value3");
        expect(context.getItem("test3").get()).toBe("value3");
        expect(onSave.mock.calls.length).toBe(1);
        expect(onSave.mock.calls[0][0]).toEqual({ test3: "value3", test2: "value2" });
    });
});

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
const SessionContext_1 = require("./SessionContext");
describe("SessionContext", () => {
    let onSave;
    beforeEach(() => {
        onSave = jest.fn();
    });
    it("getItem::when item not existing, should create onemitter", () => {
        const data = {};
        const context = new SessionContext_1.default({
            data,
            onSave,
        });
        expect(context.getItem("test").has()).toBe(false);
    });
    it("getItem::when item created by inited data, should return value", () => {
        const context = new SessionContext_1.default({
            data: { test: "value1" },
            onSave,
        });
        expect(context.getItem("test").get()).toBe("value1");
    });
    it(`setItem::when item not existing, should create onemitter and call onSave with all data`, () => __awaiter(this, void 0, void 0, function* () {
        const context = new SessionContext_1.default({
            data: { test2: "value2" },
            onSave,
        });
        yield context.setItem("test3", "value3");
        expect(context.getItem("test3").get()).toBe("value3");
        expect(onSave.mock.calls.length).toBe(1);
        expect(onSave.mock.calls[0][0]).toEqual({ test3: "value3", test2: "value2" });
    }));
});

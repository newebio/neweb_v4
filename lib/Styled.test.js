"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
// tslint:disable-next-line:no-implicit-dependencies
const react_test_renderer_1 = require("react-test-renderer");
const Styled_1 = require("./Styled");
describe("Styled::tests", () => {
    it("component should create css from props and add it to render", () => {
        const el = react_test_renderer_1.create(React.createElement(Styled_1.default, {
            styles: {
                "button": {
                    color: "blue",
                },
                "ul li>a": {
                    color: "red",
                },
            },
        }));
        expect(el.toJSON()).toMatchSnapshot();
    });
});

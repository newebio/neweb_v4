import React = require("react");
// tslint:disable-next-line:no-implicit-dependencies
import { create } from "react-test-renderer";
import Styled from "./Styled";
describe("Styled::tests", () => {
    it("component should create css from props and add it to render", () => {
        const el = create(React.createElement(Styled, {
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

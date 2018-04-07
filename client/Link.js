"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const NavigateContext_1 = require("./NavigateContext");
exports.default = (props) => React.createElement(NavigateContext_1.default, {
    children: (navigate) => React.createElement("a", Object.assign({}, props, { onClick: (e) => {
            e.preventDefault();
            navigate(props.href);
        } })),
});

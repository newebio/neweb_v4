"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const HistoryContext_1 = require("./HistoryContext");
exports.default = (props) => React.createElement(HistoryContext_1.default, {
    children: (history) => React.createElement("a", Object.assign({}, props, { onClick: (e) => {
            if (props.target !== "_blank" && !e.ctrlKey && props.href) {
                e.preventDefault();
                history.push(props.href);
            }
        } })),
});

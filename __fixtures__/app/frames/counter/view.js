"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
class CounterView extends React.Component {
    render() {
        return React.createElement("div", {}, [this.props.data]);
    }
}
exports.default = CounterView;

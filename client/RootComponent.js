"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
class RootComponent extends React.Component {
    constructor() {
        super(...arguments);
        this.state = { children: undefined };
    }
    componentWillMount() {
        this.setState({ children: this.props.children.has() ? this.props.children.get() : undefined });
        this.callback = (children) => {
            this.setState({ children });
        };
        this.props.children.on(this.callback);
    }
    componentWillUnmount() {
        this.props.children.off(this.callback);
    }
    render() {
        return this.state.children;
    }
}
exports.default = RootComponent;

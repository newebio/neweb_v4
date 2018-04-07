"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const common_1 = require("./../common");
class RootComponent extends React.Component {
    constructor() {
        super(...arguments);
        this.state = { children: undefined, seansStatus: "unknown", networkStatus: "" };
    }
    componentWillMount() {
        this.setState({ children: this.props.children.has() ? this.props.children.get() : undefined });
        this.callback = (children) => {
            this.setState({ children });
        };
        this.props.children.on(this.callback);
        // seansStatus
        this.setState({
            seansStatus: this.props.seansStatusEmitter.has() ? this.props.seansStatusEmitter.get() :
                undefined,
        });
        this.seansStatusCallback = (status) => {
            this.setState({ seansStatus: status });
        };
        this.props.seansStatusEmitter.on(this.seansStatusCallback);
        // networkStatus
        this.setState({
            networkStatus: this.props.networkStatusEmitter.has() ? this.props.networkStatusEmitter.get() :
                undefined,
        });
        this.networkStatusCallback = (status) => {
            this.setState({ networkStatus: status });
        };
        this.props.networkStatusEmitter.on(this.networkStatusCallback);
    }
    componentWillUnmount() {
        this.props.children.off(this.callback);
        this.props.networkStatusEmitter.off(this.networkStatusCallback);
        this.props.seansStatusEmitter.off(this.seansStatusCallback);
    }
    render() {
        return React.createElement(common_1.NetworkStatusContext.Provider, {
            children: React.createElement(common_1.SeansStatusContext.Provider, {
                value: this.state.seansStatus,
                children: this.state.children,
            }),
            value: this.state.networkStatus,
        });
    }
}
exports.default = RootComponent;

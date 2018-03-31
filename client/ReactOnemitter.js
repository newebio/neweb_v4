"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
class ReactOnemitter extends react_1.Component {
    componentWillMount() {
        this.propsEmitterCallback = (props) => {
            this.setState(props);
        };
        this.componentEmitterCallback = (component) => {
            this.setState({ ___component: component });
        };
        const state = this.props.propsEmitter.has() ? Object.assign({}, this.props.propsEmitter.get()) : {};
        if (this.props.componentEmitter.has()) {
            state.___component = this.props.componentEmitter.get();
        }
        this.props.propsEmitter.on(this.propsEmitterCallback);
        this.props.componentEmitter.on(this.componentEmitterCallback);
        this.setState(state);
    }
    componentWillUnmount() {
        this.props.propsEmitter.off(this.propsEmitterCallback);
        this.props.componentEmitter.off(this.componentEmitterCallback);
    }
    render() {
        const props = Object.assign({}, this.state);
        delete props.___component;
        return react_1.createElement(this.state.___component, props);
    }
}
exports.default = ReactOnemitter;

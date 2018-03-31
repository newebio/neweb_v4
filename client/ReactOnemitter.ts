import { Onemitter } from "onemitter";
import { Component, createElement } from "react";
class ReactOnemitter extends Component<{
    propsEmitter: Onemitter<any>;
    componentEmitter: Onemitter<React.ComponentClass<any>>;
}, any> {
    protected propsEmitterCallback: any;
    protected componentEmitterCallback: any;

    public componentWillMount() {
        this.propsEmitterCallback = (props: any) => {
            this.setState(props);
        };
        this.componentEmitterCallback = (component: any) => {
            this.setState({ ___component: component });
        };
        const state = this.props.propsEmitter.has() ? { ...this.props.propsEmitter.get() } : {};
        if (this.props.componentEmitter.has()) {
            state.___component = this.props.componentEmitter.get();
        }
        this.props.propsEmitter.on(this.propsEmitterCallback);
        this.props.componentEmitter.on(this.componentEmitterCallback);
        this.setState(state);
    }
    public componentWillUnmount() {
        this.props.propsEmitter.off(this.propsEmitterCallback);
        this.props.componentEmitter.off(this.componentEmitterCallback);
    }
    public render() {
        const props = { ...this.state };
        delete props.___component;
        return createElement(this.state.___component, props);
    }
}
export default ReactOnemitter;

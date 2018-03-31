import { Onemitter } from "onemitter";
import React = require("react");
class RootComponent extends React.Component<{
    children: Onemitter<any>;
}, {
        children: any;
    }> {
    public state = { children: undefined };
    protected callback: any;
    public componentWillMount() {
        this.setState({ children: this.props.children.has() ? this.props.children.get() : undefined });
        this.callback = (children: any) => {
            this.setState({ children });
        };
        this.props.children.on(this.callback);
    }
    public componentWillUnmount() {
        this.props.children.off(this.callback);
    }
    public render() {
        return this.state.children;
    }
}
export default RootComponent;

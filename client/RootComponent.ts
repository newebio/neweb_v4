import { Onemitter } from "onemitter";
import React = require("react");
import { NetworkStatusContext, SeansStatusContext } from "./../common";
class RootComponent extends React.Component<{
    children: Onemitter<any>;
    seansStatusEmitter: Onemitter<any>;
    networkStatusEmitter: Onemitter<any>;
}, {
        children: any;
        seansStatus: string;
        networkStatus: string;
    }> {
    public state = { children: undefined, seansStatus: "unknown", networkStatus: "" };
    protected callback: any;
    protected seansStatusCallback: any;
    protected networkStatusCallback: any;
    public componentWillMount() {
        this.setState({ children: this.props.children.has() ? this.props.children.get() : undefined });
        this.callback = (children: any) => {
            this.setState({ children });
        };
        this.props.children.on(this.callback);
        // seansStatus
        this.setState({
            seansStatus: this.props.seansStatusEmitter.has() ? this.props.seansStatusEmitter.get() :
                undefined,
        });
        this.seansStatusCallback = (status: string) => {
            this.setState({ seansStatus: status });
        };
        this.props.seansStatusEmitter.on(this.seansStatusCallback);
        // networkStatus
        this.setState({
            networkStatus: this.props.networkStatusEmitter.has() ? this.props.networkStatusEmitter.get() :
                undefined,
        });
        this.networkStatusCallback = (status: string) => {
            this.setState({ networkStatus: status });
        };
        this.props.networkStatusEmitter.on(this.networkStatusCallback);
    }
    public componentWillUnmount() {
        this.props.children.off(this.callback);
        this.props.networkStatusEmitter.off(this.networkStatusCallback);
        this.props.seansStatusEmitter.off(this.seansStatusCallback);
    }
    public render() {
        return React.createElement(NetworkStatusContext.Provider, {
            children: React.createElement(SeansStatusContext.Provider, {
                value: this.state.seansStatus,
                children: this.state.children,
            }),
            value: this.state.networkStatus,
        });
    }
}
export default RootComponent;

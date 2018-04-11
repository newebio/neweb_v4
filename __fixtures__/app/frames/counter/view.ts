import React = require("react");
import { IViewProps } from "../../../..";
export default class CounterView extends React.Component<IViewProps<any, any>, {}> {
    public render() {
        return React.createElement("div", {}, [this.props.data]);
    }
}

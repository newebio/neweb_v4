import React = require("react");
import { IHistoryContext } from "./../typings";
import HistoryContext from "./HistoryContext";
export default (props: React.AnchorHTMLAttributes<any>) => React.createElement(HistoryContext, {
    children: (history: IHistoryContext) => (React.createElement as any)("a", {
        ...props, onClick: (e: MouseEvent) => {
            if (props.target !== "_blank" && !e.ctrlKey && props.href) {
                e.preventDefault();
                history.push(props.href);
            }
        },
    }),
});

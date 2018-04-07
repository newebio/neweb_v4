import React = require("react");
import NavigateContext from "./NavigateContext";
export default (props: React.AnchorHTMLAttributes<any>) =>
    React.createElement(NavigateContext, {
        children: (navigate: any) => (React.createElement as any)("a", {
            ...props, onClick: (e: any) => {
                e.preventDefault();
                navigate(props.href);
            },
        }),
    });

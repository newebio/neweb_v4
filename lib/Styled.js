"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const JSS = require("jss");
const React = require("react");
class Styled extends React.Component {
    static reset() {
        Styled.id = 0;
    }
    componentWillMount() {
        this.id = ++Styled.id;
    }
    render() {
        const jss = JSS.create({
            createGenerateClassName: () => {
                return (a) => {
                    return "s" + this.id + " " + a.key;
                };
            },
        });
        jss.use({
            onProcessRule: ((rule) => {
                rule.selectorText = rule.key;
            }),
        });
        const styleSheet = jss.createStyleSheet(this.props.styles);
        return React.createElement("div", { className: "s" + this.id }, [
            React.createElement("div", {
                key: "style",
                dangerouslySetInnerHTML: { __html: `<style type="text/css">${styleSheet.toString()}</style>` },
            }),
            this.props.children,
        ]);
    }
}
Styled.id = 0;
exports.default = Styled;

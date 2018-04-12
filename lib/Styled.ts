import JSS = require("jss");
import React = require("react");
class Styled extends React.Component<{
    styles: JSS.Styles;
}, {}> {
    public static reset() {
        Styled.id = 0;
    }
    protected static id = 0;
    protected id: number;
    public componentWillMount() {
        this.id = ++Styled.id;
    }
    public render() {
        const jss = JSS.create({});
        jss.use({
            onProcessRule: ((rule: any) => {
                rule.selectorText = ".s__s" + this.id + " " + rule.key;
            }) as any,
        });
        const styleSheet = jss.createStyleSheet(this.props.styles);
        return React.createElement("div", { className: "s__s" + this.id }, [
            React.createElement("div", {
                key: "style",
                dangerouslySetInnerHTML: { __html: `<style type="text/css">${styleSheet.toString()}</style>` },
            }),
            this.props.children,
        ]);
    }
}
export default Styled;

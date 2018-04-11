interface MyInterface {
    prop1: {
        big: {
            complex: {
                anonymous: { type: {} }
            }
        }
    },

    // prop2 shares some structure with prop1
    prop2: MyInterface["prop1"]["big"]["complex"];
}

interface IMyInterface2<P> {
    value: P;
}

type X = IMyInterface2<string>;

const a: X["value"];


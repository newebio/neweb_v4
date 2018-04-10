class ExpressResponse {
    public static instance: ExpressResponse;
    protected code: number = 0;
    protected body: string = "";
    protected headers: any = {};
    constructor() {
        ExpressResponse.instance = this;
    }
    public header(name: string, value: string) {
        this.headers[name] = value;
    }
    public sendStatus(code: number) {
        this.code = code;
    }
    public status(code: number) {
        this.code = code;
        return {
            send: (body: string) => {
                this.body = body;
            },
        };
    }
    public getResponse() {
        return {
            statusCode: this.code,
            body: this.body,
            headers: this.headers,
        };
    }
}
export default ExpressResponse;

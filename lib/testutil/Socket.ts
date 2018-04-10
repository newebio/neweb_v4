class Socket {
    public static instance: Socket;
    public on = jest.fn();
    public removeAllListeners = jest.fn();
    public request = {
        headers: {
            cookie: "sessid=sid1",
        },
        cookies: undefined,
    };
    public conn = {
        remoteAddress: "127.0." + Math.floor(Math.random() * 254) + "." + Math.floor(Math.random() * 254),
    };
    constructor() {
        Socket.instance = this;
    }
}
export default Socket;

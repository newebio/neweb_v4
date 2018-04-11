import { FrameController } from "../../../..";

export default class extends FrameController<any, any, any> {
    public getInitialData() {
        return "Hello, world!";
    }
}

import { FrameController } from "../../../..";

export default class CounterController extends FrameController<any, any, any> {
    public static instance: CounterController;
    public onInit() {
        CounterController.instance = this;
    }
    public getInitialData() {
        return 0;
    }
}

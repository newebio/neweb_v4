import { IPage } from "../..";

class PageRenderer {
    public render(page: IPage) {
        return JSON.stringify(page);
    }
}
export default PageRenderer;

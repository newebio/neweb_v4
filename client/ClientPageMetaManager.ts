import { IPage } from "./../typings";

class ClientPageMetaManager {
    public update(page: IPage) {
        document.title = page.title || "";
        const head = document.getElementsByTagName("head")[0];
        let isStartRemove = false;
        let metaEndNode: Node | undefined;
        for (const child of head.childNodes) {
            if (isStartRemove) {
                if (child.nodeType === 8 && child.nodeValue === "__page_meta_end__") {
                    metaEndNode = child;
                    break;
                }
                head.removeChild(child);
                continue;
            }
            if (child.nodeType === 8 && child.nodeValue === "__page_meta_start__") {
                isStartRemove = true;
            }
        }
        if (page.meta && page.meta.length > 0 && metaEndNode) {
            for (const meta of page.meta) {
                const metaEl = document.createElement("meta");
                metaEl.name = meta.name;
                metaEl.content = meta.content;
                head.insertBefore(metaEl, metaEndNode);
            }
        }
    }
}
export default ClientPageMetaManager;

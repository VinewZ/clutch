import ReactReconciler from "react-reconciler";
import hostConfig from "./host-config";
import { resetState } from "../state";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const reconciler = ReactReconciler(hostConfig);
const onError = (error) => {
    console.error("[RECONCILER] Error:", error.message);
};
function createContainer() {
    return { id: "root", children: [] };
}
export function createReconciler(_options) {
    const container = createContainer();
    const rootHandle = reconciler.createContainer(container, 0, null, false, null, "", onError, onError, onError, () => { });
    return {
        render(element) {
            reconciler.updateContainerSync(element, rootHandle, null, null);
            if (typeof reconciler.flushSyncWork === "function") {
                reconciler.flushSyncWork();
            }
            return container.children[0] ?? null;
        },
        unmount() {
            reconciler.updateContainerSync(null, rootHandle, null, null);
            if (typeof reconciler.flushSyncWork === "function") {
                reconciler.flushSyncWork();
            }
        },
    };
}
export function render(element, options) {
    const renderer = createReconciler(options);
    return renderer.render(element);
}
export { resetState };
//# sourceMappingURL=index.js.map
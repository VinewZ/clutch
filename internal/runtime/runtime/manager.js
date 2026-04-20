import { createReconciler } from "../reconciler";
import { clearExtensionHandlers } from "../reconciler/handler-registry";
import { loadExtension } from "./loader";
export function createRuntimeManager(config) {
    const extensions = new Map();
    const renderers = new Map();
    let activeExtensionId = null;
    return {
        async startExtension(extensionPath, command) {
            const loaded = await loadExtension(extensionPath, command);
            const renderer = createReconciler({
                onUpdate: (json) => {
                    if (json) {
                        config?.onRender?.(loaded.id, json);
                    }
                },
            });
            extensions.set(loaded.id, loaded);
            renderers.set(loaded.id, renderer);
            activeExtensionId = loaded.id;
            const json = renderer.render(loaded.component);
            if (!json) {
                throw new Error("Initial render returned null");
            }
            return json;
        },
        async stopExtension(extensionId) {
            const renderer = renderers.get(extensionId);
            if (renderer) {
                renderer.unmount();
                renderers.delete(extensionId);
            }
            extensions.delete(extensionId);
            clearExtensionHandlers(extensionId);
            if (activeExtensionId === extensionId) {
                activeExtensionId = null;
            }
        },
        async render(extensionId) {
            const renderer = renderers.get(extensionId);
            const extension = extensions.get(extensionId);
            if (!renderer || !extension) {
                throw new Error(`Extension not found: ${extensionId}`);
            }
            const json = renderer.render(extension.component);
            if (!json) {
                throw new Error("Render returned null");
            }
            return json;
        },
        getActiveExtension() {
            return activeExtensionId;
        },
    };
}
//# sourceMappingURL=manager.js.map
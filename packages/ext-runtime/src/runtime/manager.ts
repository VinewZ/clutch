import { createReconciler, type JsonRendererAPI } from "../reconciler";
import { clearExtensionHandlers } from "../reconciler/handler-registry";
import type { JSONNode } from "../socket/protocol";
import { type LoadedExtension, loadExtension } from "./loader";

export interface RuntimeManagerConfig {
	onRender?: (extensionId: string, json: JSONNode) => void;
	onError?: (extensionId: string, error: Error) => void;
}

export interface RuntimeManager {
	startExtension(
		extensionPath: string,
		command: string,
		initialState?: unknown,
	): Promise<JSONNode>;
	stopExtension(extensionId: string): Promise<void>;
	render(extensionId: string, state: unknown): Promise<JSONNode>;
	getActiveExtension(): string | null;
}

export function createRuntimeManager(
	config?: RuntimeManagerConfig,
): RuntimeManager {
	const extensions: Map<string, LoadedExtension> = new Map();
	const renderers: Map<string, JsonRendererAPI> = new Map();
	let activeExtensionId: string | null = null;

	return {
		async startExtension(
			extensionPath: string,
			command: string,
			initialState?: unknown,
		): Promise<JSONNode> {
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

			const json = renderer.render(loaded.component, initialState);
			if (!json) {
				throw new Error("Initial render returned null");
			}
			return json;
		},

		async stopExtension(extensionId: string): Promise<void> {
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

		async render(extensionId: string, state: unknown): Promise<JSONNode> {
			const renderer = renderers.get(extensionId);
			const extension = extensions.get(extensionId);

			if (!renderer || !extension) {
				throw new Error(`Extension not found: ${extensionId}`);
			}

			const json = renderer.render(extension.component, state);
			if (!json) {
				throw new Error("Render returned null");
			}
			return json;
		},

		getActiveExtension(): string | null {
			return activeExtensionId;
		},
	};
}

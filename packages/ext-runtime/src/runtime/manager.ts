import { createReconciler, type JsonRendererAPI } from "../reconciler";
import { clearExtensionHandlers } from "../reconciler/handler-registry";
import type { JSONNode } from "../socket/protocol";
import { type LoadedExtension, loadExtension } from "./loader";

export interface RuntimeManagerConfig {
	onRender?: (extensionId: string, json: JSONNode) => void;
	onError?: (extensionId: string, error: Error) => void;
}

export interface RuntimeManager {
	startExtension(extensionPath: string, command: string): Promise<string>;
	stopExtension(extensionId: string): Promise<void>;
	render(extensionId: string): void;
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
		): Promise<string> {
			const loaded = await loadExtension(extensionPath, command);

			const renderer = createReconciler({
				extensionId: loaded.id,
				onUpdate: (json) => {
					if (json) {
						config?.onRender?.(loaded.id, json);
					}
				},
			});

			extensions.set(loaded.id, loaded);
			renderers.set(loaded.id, renderer);
			activeExtensionId = loaded.id;

			renderer.render(loaded.component);
			return loaded.id;
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

		render(extensionId: string): void {
			const renderer = renderers.get(extensionId);
			const extension = extensions.get(extensionId);

			if (!renderer || !extension) {
				throw new Error(`Extension not found: ${extensionId}`);
			}

			renderer.update(extension.component);
		},

		getActiveExtension(): string | null {
			return activeExtensionId;
		},
	};
}

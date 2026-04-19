import type { ReactNode } from "react";
import ReactReconciler from "react-reconciler";
import hostConfig from "./host-config";
import type {
	JSONNode,
	JsonRendererContainer,
	JsonRendererOptions,
} from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const reconciler = ReactReconciler(hostConfig as any);

function createContainer(): JsonRendererContainer {
	return {
		root: null,
		listeners: new Set(),
		version: 0,
	};
}

export interface JsonRendererAPI {
	render(component: ReactNode): JSONNode | null;
	unmount(): void;
}

export function createReconciler(
	options?: JsonRendererOptions,
): JsonRendererAPI {
	const container = createContainer();

	if (options?.onUpdate) {
		container.listeners.add(options.onUpdate);
	}

	const root = reconciler.createContainer(
		container,
		0,
		null,
		false,
		null,
		"",
		() => {},
		() => {},
		() => {},
		() => {},
	);

	return {
		render(element: ReactNode): JSONNode | null {
			reconciler.updateContainerSync(element, root, null, null);
			reconciler.flushSyncWork();
			return container.root;
		},

		unmount(): void {
			reconciler.updateContainerSync(null, root, null, null);
			reconciler.flushSyncWork();
		},
	};
}

export function render(
	element: ReactNode,
	options?: JsonRendererOptions,
): JSONNode | null {
	const renderer = createReconciler(options);
	return renderer.render(element);
}

export { setExtensionContext, clearExtensionContext } from "./host-config";
export type {
	JSONNode,
	JsonRendererContainer,
	JsonRendererOptions,
} from "./types";

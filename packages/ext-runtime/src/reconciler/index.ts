import type { ReactNode } from "react";
import ReactReconciler from "react-reconciler";
import hostConfig from "./host-config";
import type {
	JSONNode,
	JsonRendererContainer,
	JsonRendererRoot,
} from "./types";
import { resetIdCounter } from "./utils";

const reconciler = ReactReconciler(hostConfig);

function createContainer(): JsonRendererContainer {
	return {
		root: null,
		listeners: new Set(),
		version: 0,
	};
}

interface JsonRendererOptions {
	onUpdate?: (json: JSONNode | null) => void;
}

function noop() {}

export function render(
	element: ReactNode,
	options?: JsonRendererOptions,
): JSONNode | null {
	resetIdCounter();

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
		noop,
		noop,
		noop,
		noop,
	);

	reconciler.updateContainer(element, root, null, null);

	return container.root;
}

export function createRoot(options?: JsonRendererOptions): JsonRendererRoot {
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
		noop,
		noop,
		noop,
		noop,
	);

	return {
		render(element: ReactNode): void {
			reconciler.updateContainer(element, root, null, null);
		},

		unmount(): void {
			reconciler.updateContainer(null, root, null, null);
		},

		getSnapshot(): JSONNode | null {
			return container.root;
		},

		subscribe(listener: (json: JSONNode | null) => void): () => void {
			container.listeners.add(listener);
			return () => {
				container.listeners.delete(listener);
			};
		},
	};
}

export { clearExtensionContext, setExtensionContext } from "./host-config";
export type { JSONNode, JsonRendererRoot } from "./types";
export { resetIdCounter } from "./utils";

export interface JsonRendererAPI {
	render(component: ReactNode, state?: unknown): JSONNode | null;
	unmount(): void;
}

export function createReconciler(
	options?: JsonRendererOptions,
): JsonRendererAPI {
	console.error("[RECONCILER] Creating reconciler with options:", !!options);

	const container = createContainer();

	if (options?.onUpdate) {
		console.error("[RECONCILER] Added onUpdate listener");
		container.listeners.add(options.onUpdate);
	}

	const root = reconciler.createContainer(
		container,
		0,
		null,
		false,
		null,
		"",
		noop,
		noop,
		noop,
		noop,
	);
	console.error("[RECONCILER] Container created");

	return {
		render(element: ReactNode, _state?: unknown): JSONNode | null {
			console.error(
				"[RECONCILER] render() called with element type:",
				typeof element,
			);
			reconciler.updateContainer(element, root, null, null);
			console.error(
				"[RECONCILER] updateContainer completed, container.root:",
				!!container.root,
			);
			return container.root;
		},

		unmount(): void {
			console.error("[RECONCILER] unmount() called");
			reconciler.updateContainer(null, root, null, null);
		},
	};
}

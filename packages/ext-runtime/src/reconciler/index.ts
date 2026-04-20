import type { ReactNode } from "react";
import ReactReconciler from "react-reconciler";
import hostConfig from "./host-config";
import type { JSONNode, Container, JsonRendererOptions } from "./types";
import { resetState } from "../state";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const reconciler = ReactReconciler(hostConfig as any);

const onError = (error: Error) => {
	console.error("[RECONCILER] Error:", error.message);
};

function createContainer(): Container {
	return { id: "root", children: [] };
}

export interface JsonRendererAPI {
	render(component: ReactNode): JSONNode | null;
	unmount(): void;
}

export function createReconciler(
	_options?: JsonRendererOptions,
): JsonRendererAPI {
	const container = createContainer();

	const rootHandle = reconciler.createContainer(
		container,
		0,
		null,
		false,
		null,
		"",
		onError,
		onError,
		onError,
		() => {},
	);

	return {
		render(element: ReactNode): JSONNode | null {
			reconciler.updateContainerSync(element, rootHandle, null, null);
			if (typeof reconciler.flushSyncWork === "function") {
				reconciler.flushSyncWork();
			}
			return container.children[0] ?? null;
		},

		unmount(): void {
			reconciler.updateContainerSync(null, rootHandle, null, null);
			if (typeof reconciler.flushSyncWork === "function") {
				reconciler.flushSyncWork();
			}
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

export { resetState };
export type { JSONNode, Container, JsonRendererOptions } from "./types";

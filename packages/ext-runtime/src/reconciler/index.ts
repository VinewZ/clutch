import type { ReactNode } from "react";
import ReactReconciler from "react-reconciler";
import { ConcurrentRoot } from "react-reconciler/constants";
import type { ReconcilerState } from "./host-config";
import { createHostConfig } from "./host-config";
import type { Container, JSONNode, JsonRendererOptions } from "./types";

function createContainer(): Container {
	return { id: "root", children: [] };
}

function createReconcilerState(
	onUpdate: ((json: JSONNode | null) => void) | null,
	extensionId: string,
): ReconcilerState {
	let instanceCounter = 0;
	const instances = new Map<number, JSONNode>();
	return {
		instances,
		getNextInstanceId: () => ++instanceCounter,
		onUpdate,
		extensionId,
	};
}

export interface JsonRendererAPI {
	render(component: ReactNode): void;
	update(component: ReactNode): void;
	unmount(): void;
	flushSync(): void;
}

export type ReconcilerErrorCallback = (error: Error) => void;

export function createReconciler(
	options?: JsonRendererOptions & {
		onError?: ReconcilerErrorCallback;
		onCaughtError?: ReconcilerErrorCallback;
		onRecoverableError?: ReconcilerErrorCallback;
	},
): JsonRendererAPI {
	const state = createReconcilerState(
		options?.onUpdate ?? null,
		options?.extensionId ?? "",
	);
	const hostConfig = createHostConfig(state);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const reconciler = ReactReconciler(hostConfig as any);

	const container = createContainer();

	const makeErrorHandler =
		(label: string, cb?: ReconcilerErrorCallback) => (error: Error) => {
			console.error(`[RECONCILER] ${label}:`, error.message);
			console.error(`[RECONCILER] ${label} Stack:`, error.stack);
			cb?.(error);
		};

	const rootHandle = reconciler.createContainer(
		container,
		ConcurrentRoot,
		null,
		false,
		null,
		"",
		makeErrorHandler("UncaughtError", options?.onError),
		makeErrorHandler("CaughtError", options?.onCaughtError),
		makeErrorHandler("RecoverableError", options?.onRecoverableError),
		() => {},
	);

	return {
		render(element: ReactNode): void {
			reconciler.updateContainer(element, rootHandle, null, null);
		},

		update(element: ReactNode): void {
			reconciler.updateContainer(element, rootHandle, null, null);
		},

		unmount(): void {
			reconciler.updateContainer(null, rootHandle, null, null);
		},

		flushSync(): void {
			if (typeof reconciler.flushSyncWork === "function") {
				reconciler.flushSyncWork();
			}
		},
	};
}

export type { Container, JSONNode, JsonRendererOptions } from "./types";

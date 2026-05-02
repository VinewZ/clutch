import type { Fiber, OpaqueHandle } from "react-reconciler";
import React from "react";
import * as Scheduler from "scheduler";
import {
	createAdaptedHandler,
	EVENT_EXTRACTORS,
	handlerRegistry,
} from "./handler-registry";
import type { Container, JSONNode, TextJSONNode } from "./types";

const FRAGMENT_TYPE = "FRAGMENT";

function isFragmentType(type: unknown): boolean {
	return type === React.Fragment || type === FRAGMENT_TYPE;
}

function stringifyType(type: unknown): string {
	if (type === null || type === undefined) return "Unknown";
	if (isFragmentType(type)) return FRAGMENT_TYPE;
	if (typeof type === "string") return type;
	if (typeof type === "function") {
		return (
			(type as { displayName?: string }).displayName || type.name || "Anonymous"
		);
	}
	return String(type);
}

export interface ReconcilerState {
	instances: Map<number, JSONNode>;
	getNextInstanceId: () => number;
	onUpdate: ((json: JSONNode | null) => void) | null;
	extensionId: string;
}

function sanitizeValue(value: unknown, seen: WeakSet<object>): unknown {
	if (value === null || value === undefined) return undefined;
	const t = typeof value;
	if (t === "function" || t === "symbol") return undefined;
	if (t !== "object") return value;
	if (seen.has(value as object)) return undefined;
	if (Array.isArray(value)) {
		seen.add(value as object);
		return value.map((v) => sanitizeValue(v, seen));
	}
	const proto = Object.getPrototypeOf(value);
	if (proto !== null && proto !== Object.prototype) return undefined;
	seen.add(value as object);
	const result: Record<string, unknown> = {};
	for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
		const cleaned = sanitizeValue(val, seen);
		if (cleaned !== undefined) result[key] = cleaned;
	}
	return result;
}

function sanitizeProps(
	props: Record<string, unknown>,
): Record<string, unknown> {
	const seen = new WeakSet<object>();
	const result: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(props)) {
		const cleaned = sanitizeValue(value, seen);
		if (cleaned !== undefined) result[key] = cleaned;
	}
	return result;
}

function registerFunctionProps(
	props: Record<string, unknown>,
	extensionId: string,
): Record<string, unknown> {
	const result: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(props)) {
		if (typeof value === "function") {
			const originalHandler = value as (event?: unknown) => unknown;
			const extractor = EVENT_EXTRACTORS[key];
			const handlerToRegister = extractor
				? createAdaptedHandler(originalHandler, extractor)
				: originalHandler;
			const handlerId = handlerRegistry.register(
				extensionId,
				handlerToRegister,
			);
			console.error(
				"[registerFunctionProps] registered handler:",
				key,
				"->",
				handlerId,
				key in EVENT_EXTRACTORS ? "(adapted)" : "(raw)",
			);
			result[key] = { $handler: handlerId };
		} else if (
			value !== null &&
			typeof value === "object" &&
			!Array.isArray(value)
		) {
			const proto = Object.getPrototypeOf(value);
			if (proto === null || proto === Object.prototype) {
				const nested = registerFunctionProps(
					value as Record<string, unknown>,
					extensionId,
				);
				result[key] = nested;
			} else {
				result[key] = value;
			}
		} else {
			result[key] = value;
		}
	}
	return result;
}

type FlattenableChild = JSONNode | TextJSONNode;

function flattenFragments(node: FlattenableChild): FlattenableChild {
	if (node.type !== "FRAGMENT") {
		if ("children" in node && Array.isArray(node.children)) {
			(node as JSONNode).children = (
				node.children as FlattenableChild[]
			).flatMap((child) => {
				const flattened = flattenFragments(child);
				return flattened.type === "FRAGMENT"
					? ((flattened as JSONNode).children as FlattenableChild[])
					: [flattened];
			});
		}
		return node;
	}

	const fragment = node as JSONNode;
	const flatChildren: FlattenableChild[] = [];
	for (const child of fragment.children as FlattenableChild[]) {
		const flattened = flattenFragments(child);
		if (flattened.type === "FRAGMENT") {
			flatChildren.push(
				...((flattened as JSONNode).children as FlattenableChild[]),
			);
		} else {
			flatChildren.push(flattened);
		}
	}
	fragment.children = flatChildren;
	return fragment;
}

function createNode(
	type: string,
	props: Record<string, unknown>,
	id: number,
): JSONNode {
	return {
		type,
		props,
		children: [],
		id: `node_${id}`,
	};
}

function createTextNode(text: string, id: number): TextJSONNode {
	return {
		type: "TEXT",
		props: { text },
		children: [],
		id: `text_${id}`,
	};
}

type Parent = JSONNode | Container;
type Child = JSONNode | TextJSONNode;

function appendChildToParent(parent: Parent, child: Child): void {
	if ("type" in parent) {
		const existingIndex = parent.children.findIndex((c) => c.id === child.id);
		if (existingIndex > -1) {
			parent.children.splice(existingIndex, 1);
		}
		parent.children.push(child);
		console.error(
			"[appendChildToParent]",
			(parent as JSONNode).type,
			"<-",
			child.type,
			`(${child.id})`,
			"total children:",
			parent.children.length,
		);
	}
}

function removeChildFromParent(parent: Parent, child: Child): void {
	if (!("children" in parent)) return;
	parent.children = parent.children.filter((c) => c.id !== child.id);
}

export function createHostConfig(state: ReconcilerState) {
	const { instances, getNextInstanceId, onUpdate, extensionId } = state;
	return {
		supportsMutation: true,
		supportsPersistence: false,
		supportsHydration: false,
		isPrimaryRenderer: true,

		getPublicInstance(
			instance: JSONNode | TextJSONNode,
		): JSONNode | TextJSONNode {
			return instance;
		},

		getRootHostContext(): object {
			return {};
		},

		getChildHostContext(): object {
			return {};
		},

		prepareForCommit(): null {
			return null;
		},

		resetAfterCommit(container: Container): void {
			if (!onUpdate) return;

			console.error(
				"[resetAfterCommit] container children:",
				container.children.length,
				container.children.map((c) => `${c.type}(${c.id})`),
			);

			if (container.children.length === 0) {
				console.error(
					"[resetAfterCommit] WARNING: empty container after commit",
				);
				console.error("[resetAfterCommit] total instances:", instances.size);
				for (const [id, node] of instances) {
					console.error(`  instance ${id}: ${node.type}`);
				}
				onUpdate(null);
				return;
			}

			if (container.children.length === 1) {
				const root = container.children[0];
				const flattened = flattenFragments(root as FlattenableChild);
				if (flattened.type === "FRAGMENT") {
					const fragChildren = (flattened as JSONNode).children;
					if (fragChildren.length === 1) {
						onUpdate(fragChildren[0] as JSONNode);
					} else {
						onUpdate({
							type: "FragmentContainer",
							props: {},
							children: fragChildren,
							id: root.id,
						});
					}
				} else {
					onUpdate(flattened as JSONNode);
				}
				return;
			}

			const flatChildren = (container.children as FlattenableChild[]).flatMap(
				(child) => {
					const flattened = flattenFragments(child);
					return flattened.type === "FRAGMENT"
						? ((flattened as JSONNode).children as FlattenableChild[])
						: [flattened];
				},
			);
			if (flatChildren.length === 1) {
				onUpdate(flatChildren[0] as JSONNode);
			} else {
				onUpdate({
					type: "FragmentContainer",
					props: {},
					children: flatChildren,
					id: "root",
				});
			}
		},

		createInstance(
			type: string,
			props: Record<string, unknown>,
			_rootContainer: Container,
			_hostContext: object,
			internalInstanceHandle: OpaqueHandle,
		): JSONNode {
			const id = getNextInstanceId();
			console.error(
				"[createInstance]",
				type,
				`(${id})`,
				"childrenInProps:",
				"children" in props,
				Array.isArray(props.children)
					? `array[${(props.children as unknown[]).length}]`
					: typeof props.children,
			);
			if ("children" in props && Array.isArray(props.children)) {
				const React = require("react") as typeof import("react");
				for (const child of props.children as unknown[]) {
					if (
						child !== null &&
						child !== undefined &&
						typeof child === "object"
					) {
						const isValid = React.isValidElement(child);
						const hasType = "$$typeof" in (child as object);
						console.error(
							"[createInstance] child check:",
							isValid ? "VALID" : "INVALID",
							"hasTypeSymbol:",
							hasType,
							"childType:",
							(child as Record<string, unknown>)?.type,
						);
					}
				}
			}
			const { children, ...restProps } = props;
			const withHandlers = registerFunctionProps(
				restProps as Record<string, unknown>,
				extensionId,
			);
			const instance = createNode(
				stringifyType(type),
				sanitizeProps(withHandlers),
				id,
			);
			(internalInstanceHandle as Fiber).stateNode = instance;
			instances.set(id, instance);
			return instance;
		},

		createTextInstance(
			text: string,
			_rootContainer: Container,
			_hostContext: object,
			_internalInstanceHandle: OpaqueHandle,
		): TextJSONNode {
			const id = getNextInstanceId();
			console.error("[createTextInstance]", JSON.stringify(text), `(${id})`);
			return createTextNode(text, id);
		},

		appendInitialChild: appendChildToParent,
		appendChild: appendChildToParent,

		appendChildToContainer(container: Container, child: Child): void {
			console.error("[appendChildToContainer]", child.type, `(${child.id})`);
			container.children.push(child);
		},

		insertBefore(
			parentInstance: JSONNode,
			child: Child,
			beforeChild: Child,
		): void {
			console.error(
				"[insertBefore]",
				parentInstance.type,
				"<-",
				child.type,
				"before",
				beforeChild.type,
			);
			const beforeIndex = parentInstance.children.findIndex(
				(c) => c.id === beforeChild.id,
			);
			if (beforeIndex !== -1) {
				parentInstance.children.splice(beforeIndex, 0, child);
			} else {
				parentInstance.children.push(child);
			}
		},

		insertInContainerBefore(
			container: Container,
			child: Child,
			beforeChild: Child,
		): void {
			const beforeIndex = container.children.findIndex(
				(c) => c.id === beforeChild.id,
			);
			if (beforeIndex !== -1) {
				container.children.splice(beforeIndex, 0, child);
			} else {
				container.children.push(child);
			}
		},

		removeChild: removeChildFromParent,
		removeChildFromContainer: removeChildFromParent,

		commitUpdate(
			instance: JSONNode,
			_type: string,
			_oldProps: Record<string, unknown>,
			newProps: Record<string, unknown>,
		): void {
			const { children, ...restProps } = newProps;
			const withHandlers = registerFunctionProps(
				restProps as Record<string, unknown>,
				extensionId,
			);
			instance.props = sanitizeProps(withHandlers);
		},

		commitTextUpdate(
			textInstance: TextJSONNode,
			_oldText: string,
			newText: string,
		): void {
			textInstance.props.text = newText;
		},

		finalizeInitialChildren(): boolean {
			return false;
		},

		shouldSetTextContent(): boolean {
			return false;
		},

		clearContainer(container: Container): void {
			container.children = [];
		},

		scheduleTimeout: setTimeout,
		cancelTimeout: (id: NodeJS.Timeout) => clearTimeout(id),
		noTimeout: -1,

		getCurrentUpdatePriority(): number {
			return 1;
		},

		setCurrentUpdatePriority(): void {},

		resolveUpdatePriority(): number {
			return 1;
		},

		resolveEventTimeStamp(): number {
			return 0;
		},

		trackSchedulerEvent(): void {},

		resolveEventType(): string | null {
			return null;
		},

		shouldAttemptEagerTransition(): boolean {
			return false;
		},

		maySuspendCommit(): boolean {
			return false;
		},

		preloadInstance(): boolean {
			return true;
		},

		startSuspendingCommit(): void {},

		suspendInstance(): void {},

		waitForCommitToBeReady(): null {
			return null;
		},

		preparePortalMount(): void {},

		getInstanceFromNode(): null {
			return null;
		},

		beforeActiveInstanceBlur(): void {},

		afterActiveInstanceBlur(): void {},

		prepareScopeUpdate(): void {},

		getInstanceFromScope(): null {
			return null;
		},

		detachDeletedInstance(): void {},

		commitMount(): void {},

		hideInstance(): void {},

		hideTextInstance(): void {},

		unhideInstance(): void {},

		unhideTextInstance(): void {},

		resetTextContent(): void {},

		supportsMicrotasks: true,
		scheduleMicrotask: queueMicrotask,

		scheduleCallback: Scheduler.unstable_scheduleCallback,
		cancelCallback: Scheduler.unstable_cancelCallback,
		shouldYield: Scheduler.unstable_shouldYield,
		now: Scheduler.unstable_now,

		resetFormInstance(): void {},
		requestPostPaintCallback(): void {},
		NotPendingTransition: null,
		HostTransitionContext: {},
	} as const;
}

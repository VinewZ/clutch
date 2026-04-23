import type { Fiber, OpaqueHandle } from "react-reconciler";
import * as Scheduler from "scheduler";
import type { JSONNode, TextJSONNode, Container } from "./types";
import { handlerRegistry } from "./handler-registry";

export interface ReconcilerState {
	instances: Map<number, JSONNode>;
	getNextInstanceId: () => number;
	onUpdate: ((json: JSONNode | null) => void) | null;
	extensionId: string;
}

function stringifyType(type: unknown): string {
	if (typeof type === "string") return type;
	if (typeof type === "function") {
		return (
			(type as { displayName?: string }).displayName || type.name || "Anonymous"
		);
	}
	return String(type);
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
			const handlerId = handlerRegistry.register(
				extensionId,
				value as (event: unknown) => unknown,
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
			const json = container.children[0] ?? null;
			if (onUpdate) {
				onUpdate(json);
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
			return createTextNode(text, id);
		},

		appendInitialChild: appendChildToParent,
		appendChild: appendChildToParent,

		appendChildToContainer(container: Container, child: Child): void {
			if (child.type === "TEXT" && !("type" in container)) return;
			container.children.push(child as JSONNode);
		},

		insertBefore(
			parentInstance: JSONNode,
			child: Child,
			beforeChild: Child,
		): void {
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
				container.children.splice(beforeIndex, 0, child as JSONNode);
			} else {
				container.children.push(child as JSONNode);
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

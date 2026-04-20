import type { Fiber, OpaqueHandle } from "react-reconciler";
import type { JSONNode, Container } from "./types";
import { instances, getNextInstanceId } from "../state";

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

type Parent = JSONNode | Container;

function appendChildToParent(parent: Parent, child: JSONNode | string): void {
	if (typeof child === "string") {
		if ("type" in parent) {
			parent.children.push(child);
		}
		return;
	}
	if ("type" in parent) {
		const existingIndex = parent.children.findIndex((c) =>
			typeof c === "string" ? false : c.id === child.id,
		);
		if (existingIndex > -1) {
			parent.children.splice(existingIndex, 1);
		}
		parent.children.push(child);
	}
}

function removeChildFromParent(parent: Parent, child: JSONNode | string): void {
	if (!("children" in parent)) return;
	parent.children = parent.children.filter((c) =>
		typeof c === "string" ? c !== child : c.id !== (child as JSONNode).id,
	);
}

export const hostConfig = {
	supportsMutation: true,
	supportsPersistence: false,
	supportsHydration: false,
	isPrimaryRenderer: true,

	getPublicInstance(instance: JSONNode | string): JSONNode {
		if (typeof instance === "string") {
			return {
				type: "TEXT",
				props: { text: instance },
				children: [],
				id: `text_${Date.now()}`,
			};
		}
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

	resetAfterCommit(): void {},

	createInstance(
		type: string,
		props: Record<string, unknown>,
		_rootContainer: Container,
		_hostContext: object,
		internalInstanceHandle: OpaqueHandle,
	): JSONNode {
		const id = getNextInstanceId();
		const { children, ...restProps } = props;
		const instance = createNode(type, restProps as Record<string, unknown>, id);
		(internalInstanceHandle as Fiber).stateNode = instance;
		instances.set(id, instance);
		return instance;
	},

	createTextInstance(
		text: string,
		_rootContainer: Container,
		_hostContext: object,
		_internalInstanceHandle: OpaqueHandle,
	): string {
		return text;
	},

	appendInitialChild: appendChildToParent,
	appendChild: appendChildToParent,

	appendChildToContainer(container: Container, child: JSONNode | string): void {
		if (typeof child === "string") return;
		container.children.push(child);
	},

	insertBefore(
		parentInstance: JSONNode,
		child: JSONNode | string,
		beforeChild: JSONNode | string,
	): void {
		const beforeIndex = parentInstance.children.findIndex(
			(c: JSONNode | string) =>
				typeof c === "string"
					? c === beforeChild
					: c.id === (beforeChild as JSONNode).id,
		);
		if (beforeIndex !== -1) {
			parentInstance.children.splice(beforeIndex, 0, child);
		} else {
			parentInstance.children.push(child);
		}
	},

	insertInContainerBefore(
		container: Container,
		child: JSONNode | string,
		beforeChild: JSONNode | string,
	): void {
		if (typeof child === "string") return;
		const beforeIndex = container.children.findIndex((c: JSONNode | string) =>
			typeof c === "string"
				? c === beforeChild
				: c.id === (beforeChild as JSONNode).id,
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
		instance.props = restProps as Record<string, unknown>;
	},

	commitTextUpdate(
		_textInstance: string,
		_oldText: string,
		_newText: string,
	): void {},

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

	resetFormInstance(): void {},
	requestPostPaintCallback(): void {},
	NotPendingTransition: null,
	HostTransitionContext: {},
} as const;

export default hostConfig;

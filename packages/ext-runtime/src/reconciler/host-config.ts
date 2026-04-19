import type { JSONNode, JsonRendererContainer } from "./types";

export function setExtensionContext(_extensionId: string): void {
	// Extension context for future use (e.g., action handlers)
}

export function clearExtensionContext(): void {
	// Extension context cleanup
}

function createNode(type: string, props: Record<string, unknown>): JSONNode {
	return {
		type,
		props,
		children: [],
		id: `node_${Math.random().toString(36).slice(2, 9)}`,
	};
}

export const hostConfig = {
	supportsMutation: true,
	supportsPersistence: false,
	supportsHydration: false,

	createInstance(type: string, props: Record<string, unknown>) {
		const { children, ...restProps } = props;
		return createNode(type, restProps as Record<string, unknown>);
	},

	createTextInstance(text: string) {
		return text;
	},

	appendInitialChild(parentInstance: JSONNode, child: JSONNode | string) {
		parentInstance.children.push(child);
	},

	finalizeInitialChildren() {
		return false;
	},

	shouldSetTextContent() {
		return false;
	},

	getRootHostContext() {
		return null;
	},

	getChildHostContext(_parentHostContext: unknown) {
		return null;
	},

	getPublicInstance(instance: JSONNode | string) {
		return instance as JSONNode;
	},

	prepareForCommit() {
		return null;
	},

	resetAfterCommit() {},

	scheduleTimeout: setTimeout,
	cancelTimeout: clearTimeout,
	noTimeout: -1 as const,

	appendChild(parentInstance: JSONNode, child: JSONNode | string) {
		parentInstance.children.push(child);
	},

	appendChildToContainer(container: JsonRendererContainer, child: JSONNode) {
		container.root = child;
	},

	removeChild(parentInstance: JSONNode, child: JSONNode | string) {
		const idx = parentInstance.children.indexOf(child);
		if (idx !== -1) parentInstance.children.splice(idx, 1);
	},

	removeChildFromContainer(container: JsonRendererContainer) {
		container.root = null;
	},

	insertBefore(
		parentInstance: JSONNode,
		child: JSONNode | string,
		beforeChild: JSONNode | string,
	) {
		const idx = parentInstance.children.indexOf(beforeChild);
		if (idx !== -1) {
			parentInstance.children.splice(idx, 0, child);
		} else {
			parentInstance.children.push(child);
		}
	},

	clearContainer(container: JsonRendererContainer) {
		container.root = null;
	},

	commitTextUpdate(_textInstance: string, _oldText: string, newText: string) {
		return newText;
	},

	commitUpdate(
		instance: JSONNode,
		_type: string,
		_prevProps: Record<string, unknown>,
		newProps: Record<string, unknown>,
	) {
		const { children, ...restProps } = newProps;
		instance.props = restProps as Record<string, unknown>;
	},

	getCurrentUpdatePriority() {
		return 0;
	},

	setCurrentUpdatePriority() {},

	resolveUpdatePriority() {
		return 0;
	},

	resolveEventTimeStamp() {
		return 0;
	},

	trackSchedulerEvent() {},

	resolveEventType(): string | null {
		return null;
	},

	shouldAttemptEagerTransition() {
		return false;
	},

	maySuspendCommit() {
		return false;
	},

	preloadInstance() {
		return true;
	},

	startSuspendingCommit() {},

	suspendInstance() {},

	waitForCommitToBeReady(): null {
		return null;
	},

	preparePortalMount() {},

	isPrimaryRenderer: false,

	getInstanceFromNode(): null {
		return null;
	},

	beforeActiveInstanceBlur() {},

	afterActiveInstanceBlur() {},

	prepareScopeUpdate() {},

	getInstanceFromScope(): null {
		return null;
	},

	detachDeletedInstance() {},

	supportsMicrotasks: true,

	scheduleMicrotask: queueMicrotask,

	resetFormInstance() {},

	requestPostPaintCallback() {},

	NotPendingTransition: null,

	HostTransitionContext: {},
} as const;

export default hostConfig;

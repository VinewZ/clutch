import type {
	Fiber,
	HostConfig,
	OpaqueHandle,
	ReactContext,
} from "react-reconciler";
import { transformProps } from "./props-transformer";
import type { JSONNode, JsonRendererContainer } from "./types";
import { extractProps, generateId, getComponentName } from "./utils";

type Instance = JSONNode;
type TextInstance = string;
type Container = JsonRendererContainer;
type Type = string | ((...args: never) => unknown);
type HostProps = { children?: unknown; [key: string]: unknown };
type SuspenseInstance = never;
type HydratableInstance = never;
type FormInstance = never;
type PublicInstance = Instance;
type HostContext = unknown;
type ChildSet = never;
type TimeoutHandle = ReturnType<typeof setTimeout>;
type NoTimeout = -1;
type TransitionStatus = unknown;

let currentExtensionId: string | null = null;
let pendingOutput = false;

export function setExtensionContext(extensionId: string): void {
	console.error("[HOST-CONFIG] setExtensionContext:", extensionId);
	currentExtensionId = extensionId;
}

export function clearExtensionContext(): void {
	console.error("[HOST-CONFIG] clearExtensionContext");
	currentExtensionId = null;
}

function scheduleJsonOutput(container: Container): void {
	if (pendingOutput) return;
	pendingOutput = true;
	queueMicrotask(() => {
		pendingOutput = false;
		container.version++;
		console.error(
			"[HOST-CONFIG] scheduleJsonOutput - notifying",
			container.listeners.size,
			"listeners",
		);
		for (const listener of container.listeners) {
			listener(container.root);
		}
	});
}

const hostConfig = {
	supportsMutation: true,
	supportsPersistence: false,
	supportsHydration: false,
	isPrimaryRenderer: false,

	createInstance(
		type: Type,
		props: HostProps,
		_rootContainer: Container,
		_hostContext: HostContext,
		_internalHandle: OpaqueHandle,
	): Instance {
		const typeName = getComponentName(type);
		console.error("[HOST-CONFIG] createInstance:", typeName);

		const transformedProps = currentExtensionId
			? transformProps(props as Record<string, unknown>, {
					extensionId: currentExtensionId,
				})
			: props;

		const extractedProps = extractProps(transformedProps);

		const instance: Instance = {
			type: typeName,
			props: extractedProps,
			children: [],
			id: generateId(),
		};

		return instance;
	},

	createTextInstance(
		text: string,
		_rootContainer: Container,
		_hostContext: HostContext,
		_internalHandle: OpaqueHandle,
	): TextInstance {
		return text;
	},

	appendInitialChild(
		parentInstance: Instance,
		child: Instance | TextInstance,
	): void {
		parentInstance.children.push(child);
	},

	finalizeInitialChildren(
		_instance: Instance,
		_type: Type,
		_props: HostProps,
		_rootContainer: Container,
		_hostContext: HostContext,
	): boolean {
		return false;
	},

	shouldSetTextContent(_type: Type, _props: HostProps): boolean {
		return false;
	},

	getRootHostContext(_rootContainer: Container): HostContext {
		return null;
	},

	getChildHostContext(
		parentHostContext: HostContext,
		_type: Type,
		_rootContainer: Container,
	): HostContext {
		return parentHostContext;
	},

	getPublicInstance(instance: Instance | TextInstance): PublicInstance {
		return instance as Instance;
	},

	prepareForCommit(_containerInfo: Container): Record<string, unknown> | null {
		return null;
	},

	resetAfterCommit(container: Container): void {
		scheduleJsonOutput(container);
	},

	preparePortalMount(_containerInfo: Container): void {},

	scheduleTimeout: setTimeout,
	cancelTimeout: clearTimeout,
	noTimeout: -1 as const,
	supportsMicrotasks: true,
	scheduleMicrotask: queueMicrotask,

	getInstanceFromNode(_node: unknown): Fiber | null {
		return null;
	},

	beforeActiveInstanceBlur(): void {},
	afterActiveInstanceBlur(): void {},
	prepareScopeUpdate(_scopeInstance: unknown, _instance: unknown): void {},
	getInstanceFromScope(_scopeInstance: unknown): Instance | null {
		return null;
	},

	detachDeletedInstance(_node: Instance): void {},

	appendChild(parentInstance: Instance, child: Instance | TextInstance): void {
		parentInstance.children.push(child);
	},

	appendChildToContainer(container: Container, child: Instance): void {
		console.error("[HOST-CONFIG] appendChildToContainer:", child.type);
		container.root = child;
		scheduleJsonOutput(container);
	},

	insertBefore(
		parentInstance: Instance,
		child: Instance | TextInstance,
		beforeChild: Instance | TextInstance,
	): void {
		const index = parentInstance.children.indexOf(
			beforeChild as Instance | string,
		);
		if (index !== -1) {
			parentInstance.children.splice(index, 0, child);
		} else {
			parentInstance.children.push(child);
		}
	},

	insertInContainerBefore(
		container: Container,
		child: Instance,
		_beforeChild: Instance,
	): void {
		container.root = child;
		scheduleJsonOutput(container);
	},

	removeChild(parentInstance: Instance, child: Instance | TextInstance): void {
		const index = parentInstance.children.indexOf(child as Instance | string);
		if (index !== -1) {
			parentInstance.children.splice(index, 1);
		}
	},

	removeChildFromContainer(container: Container, _child: Instance): void {
		container.root = null;
		scheduleJsonOutput(container);
	},

	resetTextContent(_instance: Instance): void {},

	commitTextUpdate(
		_textInstance: TextInstance,
		_oldText: string,
		newText: string,
	): TextInstance {
		return newText;
	},

	commitMount(
		_instance: Instance,
		_type: Type,
		_newProps: HostProps,
		_internalInstanceHandle: OpaqueHandle,
	): void {},

	commitUpdate(
		instance: Instance,
		_type: Type,
		_prevProps: HostProps,
		newProps: HostProps,
		_internalHandle: OpaqueHandle,
	): void {
		const transformedProps = currentExtensionId
			? transformProps(newProps as Record<string, unknown>, {
					extensionId: currentExtensionId,
				})
			: newProps;
		instance.props = extractProps(transformedProps);
	},

	hideInstance(_instance: Instance): void {},
	hideTextInstance(_textInstance: TextInstance): void {},
	unhideInstance(_instance: Instance, _props: HostProps): void {},
	unhideTextInstance(_textInstance: TextInstance, _text: string): void {},
	clearContainer(container: Container): void {
		container.root = null;
	},

	NotPendingTransition: null as TransitionStatus | null,
	HostTransitionContext: {} as ReactContext<TransitionStatus>,

	setCurrentUpdatePriority(_newPriority: number): void {},
	getCurrentUpdatePriority(): number {
		return 0;
	},
	resolveUpdatePriority(): number {
		return 0;
	},

	resetFormInstance(_form: FormInstance): void {},
	requestPostPaintCallback(_callback: (time: number) => void): void {},
	shouldAttemptEagerTransition(): boolean {
		return false;
	},
	trackSchedulerEvent(): void {},
	resolveEventType(): string | null {
		return null;
	},
	resolveEventTimeStamp(): number {
		return 0;
	},

	maySuspendCommit(_type: Type, _props: HostProps): boolean {
		return false;
	},
	preloadInstance(_type: Type, _props: HostProps): boolean {
		return true;
	},
	startSuspendingCommit(): void {},
	suspendInstance(_type: Type, _props: HostProps): void {},
	waitForCommitToBeReady():
		| ((
				initiateCommit: (...args: unknown[]) => unknown,
		  ) => (...args: unknown[]) => unknown)
		| null {
		return null;
	},
} satisfies HostConfig<
	Type,
	HostProps,
	Container,
	Instance,
	TextInstance,
	SuspenseInstance,
	HydratableInstance,
	FormInstance,
	PublicInstance,
	HostContext,
	ChildSet,
	TimeoutHandle,
	NoTimeout,
	TransitionStatus
>;

export default hostConfig;

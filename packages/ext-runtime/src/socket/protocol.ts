export type MessageCategory = "CLI" | "RUNTIME" | "RENDER" | "INTERNAL";

export interface BaseMessage {
	category: MessageCategory;
	type: string;
}

// CLI Messages
export interface CLIMessage extends BaseMessage {
	category: "CLI";
	type: "toggle" | "show" | "hide" | "quit";
}

// RUNTIME Messages
export interface RuntimeEventMessage extends BaseMessage {
	category: "RUNTIME";
	type: "event";
	extensionId: string;
	handlerId: string;
	event: SerializedEvent;
}

export interface RuntimeActionMessage extends BaseMessage {
	category: "RUNTIME";
	type: "action";
	extensionId: string;
	action: Action;
}

export interface NavigationPopMessage extends BaseMessage {
	category: "RUNTIME";
	type: "navigationPop";
	extensionId: string;
}

export interface ToastShowMessage extends BaseMessage {
	category: "RUNTIME";
	type: "toastShow";
	extensionId: string;
	toastId: string;
	style?: string;
	title: string;
	message?: string;
}

export interface ToastUpdateMessage extends BaseMessage {
	category: "RUNTIME";
	type: "toastUpdate";
	extensionId: string;
	toastId: string;
	style?: string;
	title?: string;
	message?: string;
}

export interface ToastHideMessage extends BaseMessage {
	category: "RUNTIME";
	type: "toastHide";
	extensionId: string;
	toastId: string;
}

export interface RuntimeReadyMessage extends BaseMessage {
	category: "RUNTIME";
	type: "ready";
	extensionId: string;
}

// RENDER Messages
export interface RenderRequestMessage extends BaseMessage {
	category: "RENDER";
	type: "renderRequest";
	extensionId: string;
	state: unknown;
}

export interface RenderResponseMessage extends BaseMessage {
	category: "RENDER";
	type: "renderResponse";
	extensionId: string;
	json: JSONNode;
}

// INTERNAL Messages
export interface RuntimeStartMessage extends BaseMessage {
	category: "INTERNAL";
	type: "runtimeStart";
	extensionId: string;
	extensionPath: string;
	extensionCommand: string;
}

export interface RuntimeStopMessage extends BaseMessage {
	category: "INTERNAL";
	type: "runtimeStop";
	extensionId: string;
}

// Response
export interface SocketResponse<T = unknown> {
	success: boolean;
	data?: T;
	error?: { code: string; message: string };
}

// Supporting types
export interface SerializedEvent {
	type: string;
	target?: Record<string, unknown>;
	[key: string]: unknown;
}

export interface Action {
	type: string;
	payload?: unknown;
}

export interface JSONNode {
	type: string;
	props: Record<string, unknown>;
	children: (JSONNode | string)[];
	id: string;
}

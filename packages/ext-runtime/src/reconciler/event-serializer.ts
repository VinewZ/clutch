import type { SerializedEvent } from "../socket/protocol";

const KEYBOARD_PROPS = [
	"key",
	"code",
	"keyCode",
	"altKey",
	"ctrlKey",
	"metaKey",
	"shiftKey",
	"repeat",
] as const;

const MOUSE_PROPS = [
	"button",
	"buttons",
	"clientX",
	"clientY",
	"pageX",
	"pageY",
	"screenX",
	"screenY",
	"altKey",
	"ctrlKey",
	"metaKey",
	"shiftKey",
] as const;

type EventLike = {
	type?: string;
	target?: unknown;
	[key: string]: unknown;
};

function isElementLike(target: unknown): target is {
	tagName: string;
	id?: string;
	value?: string;
	checked?: boolean;
} {
	return (
		typeof target === "object" &&
		target !== null &&
		"tagName" in target &&
		typeof (target as { tagName: unknown }).tagName === "string"
	);
}

function serializeTarget(target: unknown): Record<string, unknown> | undefined {
	if (!target) return undefined;

	const result: Record<string, unknown> = {};

	if (isElementLike(target)) {
		result.tagName = target.tagName.toLowerCase();
		if (target.id) result.id = target.id;
		if (typeof target.value === "string") result.value = target.value;
		if (typeof target.checked === "boolean") result.checked = target.checked;
	}

	return Object.keys(result).length > 0 ? result : undefined;
}

function serializeKeyboardEvent(event: EventLike): Record<string, unknown> {
	const result: Record<string, unknown> = {};

	for (const prop of KEYBOARD_PROPS) {
		if (prop in event && event[prop] !== undefined) {
			result[prop] = event[prop];
		}
	}

	return result;
}

function serializeMouseEvent(event: EventLike): Record<string, unknown> {
	const result: Record<string, unknown> = {};

	for (const prop of MOUSE_PROPS) {
		if (prop in event && event[prop] !== undefined) {
			result[prop] = event[prop];
		}
	}

	return result;
}

function isKeyboardEvent(event: EventLike): boolean {
	return "key" in event || "code" in event;
}

function isMouseEvent(event: EventLike): boolean {
	return "clientX" in event || "clientY" in event || "button" in event;
}

export function serializeEvent(event: unknown): SerializedEvent {
	const reactEvent = event as { nativeEvent?: unknown; type?: string };
	const nativeEvent = (reactEvent.nativeEvent ?? event) as EventLike;
	const eventType = reactEvent.type ?? nativeEvent.type ?? "unknown";

	const serialized: SerializedEvent = {
		type: eventType,
		target: serializeTarget(nativeEvent.target),
	};

	if (isKeyboardEvent(nativeEvent)) {
		Object.assign(serialized, serializeKeyboardEvent(nativeEvent));
	} else if (isMouseEvent(nativeEvent)) {
		Object.assign(serialized, serializeMouseEvent(nativeEvent));
	}

	return serialized;
}

export function serializeEventValue(event: unknown): unknown {
	const reactEvent = event as {
		target?: { value?: unknown };
		currentTarget?: { value?: unknown };
	};

	if (reactEvent.target && "value" in reactEvent.target) {
		return reactEvent.target.value;
	}

	if (reactEvent.currentTarget && "value" in reactEvent.currentTarget) {
		return reactEvent.currentTarget.value;
	}

	return serializeEvent(event);
}

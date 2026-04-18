import type { Action, SerializedEvent } from "../socket/protocol";
import { registerHandler } from "./handler-registry";

const EVENT_HANDLER_REGEX = /^on[A-Z]/;

interface HandlerReference {
	$handler: string;
}

function isEventHandler(key: string): boolean {
	return EVENT_HANDLER_REGEX.test(key);
}

function isHandlerFunction(
	value: unknown,
): value is (event: unknown) => Action | Promise<Action> {
	return typeof value === "function";
}

function isHandlerReference(value: unknown): value is HandlerReference {
	return typeof value === "object" && value !== null && "$handler" in value;
}

export interface TransformOptions {
	extensionId: string;
	handlers?: Map<string, (event: SerializedEvent) => Action | Promise<Action>>;
}

export function transformProps(
	props: Record<string, unknown>,
	options: TransformOptions,
): Record<string, unknown> {
	const result: Record<string, unknown> = {};
	const { extensionId, handlers } = options;

	for (const [key, value] of Object.entries(props)) {
		if (key === "children" || key === "key" || key === "ref") {
			result[key] = value;
			continue;
		}

		if (isEventHandler(key) && isHandlerFunction(value)) {
			const handlerId = registerHandler(extensionId, value);

			if (handlers) {
				handlers.set(handlerId, value);
			}

			result[key] = { $handler: handlerId };
			continue;
		}

		if (isEventHandler(key) && isHandlerReference(value)) {
			result[key] = value;
			continue;
		}

		result[key] = value;
	}

	return result;
}

export function isTransformed(value: unknown): value is HandlerReference {
	return isHandlerReference(value);
}

export function getHandlerId(handlerRef: HandlerReference): string {
	return handlerRef.$handler;
}

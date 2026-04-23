import type { Action, SerializedEvent } from "../socket/protocol";

type EventHandler = (
	event: SerializedEvent,
) => Action | Promise<Action> | void | unknown;

interface HandlerInfo {
	handler: EventHandler;
	extensionId: string;
}

class HandlerRegistry {
	private handlers: Map<string, HandlerInfo> = new Map();
	private counter: number = 0;

	register(extensionId: string, handler: EventHandler): string {
		const handlerId = `handler_${this.counter++}`;
		this.handlers.set(handlerId, { handler, extensionId });
		return handlerId;
	}

	get(handlerId: string): EventHandler | undefined {
		return this.handlers.get(handlerId)?.handler;
	}

	async execute(handlerId: string, event: SerializedEvent): Promise<unknown> {
		const handlerInfo = this.handlers.get(handlerId);
		if (!handlerInfo) {
			throw new Error(`Handler not found: ${handlerId}`);
		}

		const result = handlerInfo.handler(event);

		if (result instanceof Promise) {
			return await result;
		}

		return result;
	}

	has(handlerId: string): boolean {
		return this.handlers.has(handlerId);
	}

	remove(handlerId: string): boolean {
		return this.handlers.delete(handlerId);
	}

	clearExtension(extensionId: string): void {
		for (const [id, info] of this.handlers.entries()) {
			if (info.extensionId === extensionId) {
				this.handlers.delete(id);
			}
		}
	}

	clear(): void {
		this.handlers.clear();
		this.counter = 0;
	}

	getExtensionHandlers(extensionId: string): string[] {
		const ids: string[] = [];
		for (const [id, info] of this.handlers.entries()) {
			if (info.extensionId === extensionId) {
				ids.push(id);
			}
		}
		return ids;
	}
}

export const handlerRegistry = new HandlerRegistry();

export function registerHandler(
	extensionId: string,
	handler: EventHandler,
): string {
	return handlerRegistry.register(extensionId, handler);
}

export function executeHandler(
	handlerId: string,
	event: SerializedEvent,
): Promise<unknown> {
	return handlerRegistry.execute(handlerId, event);
}

export function clearExtensionHandlers(extensionId: string): void {
	handlerRegistry.clearExtension(extensionId);
}

export function clearAllHandlers(): void {
	handlerRegistry.clear();
}

import type { Action } from "../socket/protocol";

type EventHandler = (
	event?: unknown,
) => Action | Promise<Action> | undefined | unknown;

interface HandlerInfo {
	handler: EventHandler;
	extensionId: string;
}

const NO_ARGS = Symbol("NO_ARGS");

export type EventExtractor = (event: unknown) => unknown;

export const EVENT_EXTRACTORS: Record<string, EventExtractor> = {
	onSearchTextChange: (event) => {
		const e = event as Record<string, unknown> | null | undefined;
		return e?.searchText ?? NO_ARGS;
	},
	onChange: (event) => {
		const e = event as Record<string, unknown> | null | undefined;
		return e?.value ?? NO_ARGS;
	},
	onAction: () => NO_ARGS,
	onSubmit: (event) => {
		const e = event as Record<string, unknown> | null | undefined;
		return e?.formValues ?? NO_ARGS;
	},
	onFocus: () => NO_ARGS,
	onBlur: () => NO_ARGS,
	onValidate: (event) => {
		const e = event as Record<string, unknown> | null | undefined;
		return e?.value ?? NO_ARGS;
	},
	onSelectionChange: (event) => {
		const e = event as Record<string, unknown> | null | undefined;
		return e?.indices ?? NO_ARGS;
	},
	onHover: () => NO_ARGS,
};

export function createAdaptedHandler(
	originalHandler: EventHandler,
	extractor: EventExtractor,
): EventHandler {
	return (event?: unknown) => {
		const extracted = extractor(event);
		console.error(
			"[createAdaptedHandler] extractor result:",
			typeof extracted === "symbol" ? "NO_ARGS" : typeof extracted,
			"value:",
			typeof extracted === "string"
				? extracted.slice(0, 50)
				: typeof extracted === "symbol"
					? "NO_ARGS"
					: JSON.stringify(extracted)?.slice(0, 100),
		);
		if (extracted === NO_ARGS) {
			return originalHandler();
		}
		return originalHandler(extracted);
	};
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

	async execute(handlerId: string, event: unknown): Promise<unknown> {
		const handlerInfo = this.handlers.get(handlerId);
		if (!handlerInfo) {
			console.error(
				"[HandlerRegistry] handler NOT FOUND:",
				handlerId,
				"registered handlers:",
				[...this.handlers.keys()].join(", "),
			);
			throw new Error(`Handler not found: ${handlerId}`);
		}

		console.error(
			"[HandlerRegistry] executing handler:",
			handlerId,
			"event:",
			JSON.stringify(event)?.slice(0, 200),
		);

		const result = handlerInfo.handler(event);

		if (result instanceof Promise) {
			const resolved = await result;
			console.error(
				"[HandlerRegistry] handler resolved (async):",
				handlerId,
				"result type:",
				typeof resolved,
			);
			return resolved;
		}

		console.error(
			"[HandlerRegistry] handler executed (sync):",
			handlerId,
			"result type:",
			typeof result,
		);
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
	event: unknown,
): Promise<unknown> {
	return handlerRegistry.execute(handlerId, event);
}

export function clearExtensionHandlers(extensionId: string): void {
	handlerRegistry.clearExtension(extensionId);
}

export function clearAllHandlers(): void {
	handlerRegistry.clear();
}

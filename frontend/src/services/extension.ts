import { Events } from "@wailsio/runtime";
import { ExtensionService } from "bindings/github.com/vinewz/clutch/internal/extension";
import type { Extension } from "bindings/github.com/vinewz/clutch/internal/extension/models";
import type { JsonNodeData } from "@/components/JsonNode";

const EXTENSION_RENDER = "extension:render";
const EXTENSION_ERROR = "extension:error";
const EXTENSION_TOAST = "extension:toast";

export type { Extension };

export interface ToastData {
	type: "toastShow" | "toastUpdate" | "toastHide";
	toastId: string;
	style?: string;
	title?: string;
	message?: string;
}

function unwrapWailsEvent(event: unknown): unknown {
	const e = event as { data?: unknown };
	return e.data ?? event;
}

export async function startExtension(
	name: string,
	command: string,
): Promise<Extension | null> {
	const ext = await ExtensionService.StartExtension(name, command);
	return ext;
}

export async function stopExtension(): Promise<void> {
	await ExtensionService.StopExtension();
}

export async function sendEvent(
	handlerId: string,
	event: unknown,
): Promise<void> {
	const eventJSON = JSON.stringify(event);
	await ExtensionService.SendEvent(handlerId, eventJSON);
}

export async function sendAction(
	actionType: string,
	props: Record<string, unknown>,
	handlerId?: string,
): Promise<void> {
	const propsJSON = JSON.stringify(props);
	await ExtensionService.SendAction(actionType, propsJSON, handlerId ?? "");
}

export function onRender(callback: (json: unknown) => void): () => void {
	const unsubscribe = Events.On(EXTENSION_RENDER, (event: unknown) => {
		callback(unwrapWailsEvent(event));
	});
	return unsubscribe;
}

export function onError(callback: (error: Error) => void): () => void {
	const unsubscribe = Events.On(EXTENSION_ERROR, (event: unknown) => {
		callback(unwrapWailsEvent(event) as Error);
	});
	return unsubscribe;
}

export function onToast(callback: (data: ToastData) => void): () => void {
	const unsubscribe = Events.On(EXTENSION_TOAST, (event: unknown) => {
		callback(unwrapWailsEvent(event) as ToastData);
	});
	return unsubscribe;
}

export async function navigationPop(): Promise<void> {
	await ExtensionService.NavigationPop();
}

export async function getLastRender(): Promise<JsonNodeData | null> {
	const raw = await ExtensionService.GetLastRender();
	if (!raw) return null;
	try {
		const parsed =
			typeof raw === "string"
				? (JSON.parse(raw) as { json?: JsonNodeData })
				: (raw as { json?: JsonNodeData });
		return parsed.json ?? null;
	} catch {
		return null;
	}
}

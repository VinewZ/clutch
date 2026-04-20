import { Events } from "@wailsio/runtime";
import { ExtensionService } from "bindings/github.com/vinewz/clutch/internal/extension";
import type { Extension } from "bindings/github.com/vinewz/clutch/internal/extension/models";

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
	await ExtensionService.SendEvent(handlerId, JSON.stringify(event));
}

export function onRender(callback: (json: unknown) => void): () => void {
	const unsubscribe = Events.On(EXTENSION_RENDER, (data: unknown) => {
		callback(data);
	});
	return unsubscribe;
}

export function onError(callback: (error: Error) => void): () => void {
	const unsubscribe = Events.On(EXTENSION_ERROR, (err: unknown) => {
		callback(err as Error);
	});
	return unsubscribe;
}

export function onToast(callback: (data: ToastData) => void): () => void {
	const unsubscribe = Events.On(EXTENSION_TOAST, (data: unknown) => {
		callback(data as ToastData);
	});
	return unsubscribe;
}

export async function navigationPop(): Promise<void> {
	await ExtensionService.NavigationPop();
}

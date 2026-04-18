import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import type { JsonNodeData } from "@/components/JsonNode";
import { JsonRenderer } from "@/components/JsonRenderer";
import {
	onError,
	onRender,
	sendEvent,
	startExtension,
	stopExtension,
} from "@/services/extension";

export const Route = createFileRoute("/extension/$name/$command")({
	component: ExtensionPage,
});

function ExtensionPage() {
	const { name, command } = Route.useParams();
	const [json, setJson] = useState<JsonNodeData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		let mounted = true;

		console.error("[EXTENSION PAGE] Mounting with params:", { name, command });

		async function load() {
			try {
				console.error("[EXTENSION PAGE] Starting extension:", {
					name,
					command,
				});
				setLoading(true);
				setError(null);
				const ext = await startExtension(name, command);
				console.error("[EXTENSION PAGE] Extension started:", ext);
			} catch (err) {
				console.error("[EXTENSION PAGE] Failed to start extension:", err);
				if (mounted) {
					setError(err as Error);
					setLoading(false);
				}
			}
		}

		load();

		const unsubRender = onRender((data) => {
			console.error("[EXTENSION PAGE] Received render event:", data);
			if (mounted) {
				setJson(data as JsonNodeData);
				setLoading(false);
			}
		});

		const unsubError = onError((err) => {
			console.error("[EXTENSION PAGE] Received error event:", err);
			if (mounted) {
				setError(err);
				setLoading(false);
			}
		});

		return () => {
			console.error("[EXTENSION PAGE] Unmounting, stopping extension");
			mounted = false;
			unsubRender();
			unsubError();
			stopExtension().catch((err) => {
				console.error("[EXTENSION PAGE] Error stopping extension:", err);
			});
		};
	}, [name, command]);

	const handleEvent = useCallback(async (handlerId: string, event: unknown) => {
		console.error("[EXTENSION PAGE] Sending event:", { handlerId, event });
		try {
			await sendEvent(handlerId, event);
		} catch (err) {
			console.error("[EXTENSION PAGE] Failed to send event:", err);
		}
	}, []);

	if (loading) {
		console.error("[EXTENSION PAGE] Rendering loading state");
		return (
			<div className="flex items-center justify-center h-full">
				Loading extension...
			</div>
		);
	}

	if (error) {
		console.error("[EXTENSION PAGE] Rendering error state:", error.message);
		return (
			<div className="flex items-center justify-center h-full text-red-500">
				Error: {error.message}
			</div>
		);
	}

	console.error("[EXTENSION PAGE] Rendering JSON");
	return <JsonRenderer json={json} onEvent={handleEvent} />;
}

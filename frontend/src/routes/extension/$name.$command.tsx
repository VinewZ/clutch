import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import type { JsonNodeData } from "@/components/JsonNode";
import { JsonRenderer } from "@/components/JsonRenderer";
import { ToastContainer, useToastState } from "@/components/Toast";
import {
	getLastRender,
	navigationPop,
	onError,
	onRender,
	onToast,
	sendEvent,
	startExtension,
} from "@/services/extension";

function extractNavigationDepth(json: JsonNodeData | null): number {
	if (!json) return 1;
	if (
		json.type === "NavigationContainer" &&
		typeof json.props.navigationDepth === "number"
	) {
		return json.props.navigationDepth;
	}
	for (const child of json.children) {
		if (child.type !== "TEXT") {
			const depth = extractNavigationDepth(child as JsonNodeData);
			if (depth > 1) return depth;
		}
	}
	return 1;
}

export const Route = createFileRoute("/extension/$name/$command")({
	component: ExtensionPage,
});

let globalStartedExtKey: string | null = null;

function ExtensionPage() {
	const { name, command } = Route.useParams();
	const extKey = `${name}/${command}`;
	const [json, setJson] = useState<JsonNodeData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);
	const [navigationDepth, setNavigationDepth] = useState(1);
	const { toast, handleToastData, dismissToast } = useToastState();
	const mountedRef = useRef(false);

	useEffect(() => {
		mountedRef.current = true;

		const unsubRender = onRender((data) => {
			if (mountedRef.current) {
				const renderJson = (data as { json?: JsonNodeData }).json ?? null;
				setJson(renderJson);
				setNavigationDepth(extractNavigationDepth(renderJson));
				setLoading(false);
			}
		});

		const unsubError = onError((err) => {
			if (mountedRef.current) {
				setError(err);
				setLoading(false);
			}
		});

		const unsubToast = onToast((data) => {
			handleToastData(data);
		});

		async function init() {
			if (globalStartedExtKey !== extKey) {
				globalStartedExtKey = extKey;
				try {
					await startExtension(name, command);
				} catch (err) {
					if (mountedRef.current) {
						setError(err as Error);
						setLoading(false);
					}
					globalStartedExtKey = null;
					return;
				}
			}

			try {
				const lastRender = await getLastRender();
				if (mountedRef.current && lastRender) {
					setJson(lastRender);
					setNavigationDepth(extractNavigationDepth(lastRender));
					setLoading(false);
				}
			} catch {
				// GetLastRender not available yet or no cached render
			}
		}

		init();

		return () => {
			mountedRef.current = false;
			unsubRender();
			unsubError();
			unsubToast();
		};
	}, [extKey, name, command, handleToastData]);

	const handleEvent = useCallback(async (handlerId: string, event: unknown) => {
		try {
			await sendEvent(handlerId, event);
		} catch (err) {
			console.error("[handleEvent] sendEvent failed:", err);
		}
	}, []);

	useEffect(() => {
		const handleKeyDown = async (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				e.preventDefault();
				if (navigationDepth > 1) {
					try {
						await navigationPop();
					} catch {
						// ignore
					}
				}
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [navigationDepth]);

	if (loading) {
		return (
			<div className="flex items-center justify-center h-full">
				Loading extension...
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex items-center justify-center h-full text-red-500">
				Error: {error.message}
			</div>
		);
	}

	return (
		<div className="h-full overflow-y-auto">
			<JsonRenderer json={json} onEvent={handleEvent} />
			<ToastContainer toast={toast} onDismiss={dismissToast} />
		</div>
	);
}

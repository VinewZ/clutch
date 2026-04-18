import { JsonNode, type JsonNodeData } from "./JsonNode";

interface JsonRendererProps {
	json: JsonNodeData | null;
	onEvent?: (handlerId: string, event: unknown) => void;
	className?: string;
}

export function JsonRenderer({ json, onEvent, className }: JsonRendererProps) {
	if (!json) {
		return <div className={className}>Loading...</div>;
	}

	return (
		<div className={className}>
			<JsonNode node={json} onEvent={onEvent} />
		</div>
	);
}

export type { JsonNodeData } from "./JsonNode";

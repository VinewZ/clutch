import type { RaycastComponentProps } from "./registry";
import { renderJsonChildren, type JsonNodeData, type TextJsonNodeData } from "@/components/JsonNode";

export function Slot({ node, onEvent }: RaycastComponentProps) {
	const name = node.props.name as string | undefined;
	return (
		<div data-slot={name ?? "unknown"}>
			{renderJsonChildren(
				node.children as (JsonNodeData | TextJsonNodeData)[],
				onEvent,
			)}
		</div>
	);
}

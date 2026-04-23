import type { RaycastComponentProps } from "./registry";
import { renderJsonChildren, type JsonNodeData, type TextJsonNodeData } from "@/components/JsonNode";

export function ActionPanel({ node, onEvent }: RaycastComponentProps) {
	return (
		<div data-node-type={node.type} data-node-id={node.id}>
			{renderJsonChildren(
				node.children as (JsonNodeData | TextJsonNodeData)[],
				onEvent,
			)}
		</div>
	);
}

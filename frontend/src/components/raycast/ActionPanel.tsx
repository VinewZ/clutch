import {
	type JsonNodeData,
	renderJsonChildren,
	type TextJsonNodeData,
} from "@/components/JsonNode";
import type { RaycastComponentProps } from "./types";

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

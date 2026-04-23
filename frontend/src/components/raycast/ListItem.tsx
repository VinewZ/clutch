import type { RaycastComponentProps } from "./registry";
import { renderJsonChildren, type JsonNodeData, type TextJsonNodeData } from "@/components/JsonNode";

export function ListItem({ node, onEvent }: RaycastComponentProps) {
	return (
		<div
			data-node-type={node.type}
			data-node-id={node.id}
			className="flex items-center gap-3 px-4 py-2.5"
		>
			{renderJsonChildren(
				node.children as (JsonNodeData | TextJsonNodeData)[],
				onEvent,
			)}
		</div>
	);
}

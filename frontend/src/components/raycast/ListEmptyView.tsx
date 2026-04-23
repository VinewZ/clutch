import type { RaycastComponentProps } from "./registry";
import { renderJsonChildren, type JsonNodeData, type TextJsonNodeData } from "@/components/JsonNode";

export function ListEmptyView({ node, onEvent }: RaycastComponentProps) {
	return (
		<div className="p-8 text-center text-muted-foreground">
			{renderJsonChildren(
				node.children as (JsonNodeData | TextJsonNodeData)[],
				onEvent,
			)}
		</div>
	);
}

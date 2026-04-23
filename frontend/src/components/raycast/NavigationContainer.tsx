import type { RaycastComponentProps } from "./registry";
import { renderJsonChildren, type JsonNodeData, type TextJsonNodeData } from "@/components/JsonNode";

export function NavigationContainer({ node, onEvent }: RaycastComponentProps) {
	return (
		<div
			data-navigation-depth={node.props.navigationDepth ?? 1}
			className="h-full w-full"
		>
			{renderJsonChildren(
				node.children as (JsonNodeData | TextJsonNodeData)[],
				onEvent,
			)}
		</div>
	);
}

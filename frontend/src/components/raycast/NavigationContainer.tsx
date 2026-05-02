import {
	type JsonNodeData,
	renderJsonChildren,
	type TextJsonNodeData,
} from "@/components/JsonNode";
import type { RaycastComponentProps } from "./types";

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

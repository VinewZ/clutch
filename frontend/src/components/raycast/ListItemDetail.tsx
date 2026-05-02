import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { type JsonNodeData, renderJsonNode } from "@/components/JsonNode";
import type { RaycastComponentProps } from "./types";

interface DetailChildNode {
	type: string;
	props: Record<string, unknown>;
	children: unknown[];
	id: string;
}

export function ListItemDetail({ node, onEvent }: RaycastComponentProps) {
	const markdown = node.props.markdown as string | undefined;
	const isLoading = node.props.isLoading as boolean | undefined;

	let metadataNode: JsonNodeData | null = null;
	for (const child of node.children as DetailChildNode[]) {
		if (child.type === "Slot" && child.props.name === "metadata") {
			const metadataChildren = child.children as DetailChildNode[];
			if (metadataChildren.length > 0) {
				metadataNode = metadataChildren[0] as unknown as JsonNodeData;
			}
		}
	}

	const content = markdown ?? "";

	return (
		<div data-node-type={node.type} className="flex flex-col h-full">
			{isLoading && (
				<div className="h-0.5 w-full bg-muted overflow-hidden">
					<div className="h-full w-1/3 bg-primary animate-[loading-bar_1.5s_ease-in-out_infinite]" />
				</div>
			)}
			<div className="flex-1 overflow-y-auto p-4 prose prose-sm dark:prose-invert max-w-none">
				{content && <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>}
			</div>
			{metadataNode && (
				<div className="border-t border-border p-4">
					{renderJsonNode(metadataNode, onEvent)}
				</div>
			)}
		</div>
	);
}

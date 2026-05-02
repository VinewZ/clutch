import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { RaycastComponentProps } from "./types";

export function Detail({ node }: RaycastComponentProps) {
	const markdown = node.props.markdown as string | undefined;
	const children = node.props.children as string | undefined;

	const content = markdown ?? children ?? "";

	return (
		<div
			data-node-type={node.type}
			className="p-4 overflow-y-auto prose prose-sm dark:prose-invert max-w-none"
		>
			<Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
		</div>
	);
}

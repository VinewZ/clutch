import React, { type ReactElement } from "react";

export interface JsonNodeData {
	type: string;
	props: Record<string, unknown>;
	children: (JsonNodeData | string)[];
	id: string;
}

interface JsonNodeProps {
	node: JsonNodeData | string;
	onEvent?: (handlerId: string, event: unknown) => void;
}

const elementMap: Record<string, string> = {
	div: "div",
	span: "span",
	button: "button",
	input: "input",
	form: "form",
	h1: "h1",
	h2: "h2",
	h3: "h3",
	p: "p",
	a: "a",
	img: "img",
	ul: "ul",
	ol: "ol",
	li: "li",
	label: "label",
	section: "section",
	article: "article",
	header: "header",
	footer: "footer",
	nav: "nav",
	main: "main",
	aside: "aside",
};

function renderNode(
	node: JsonNodeData | string,
	onEvent?: (handlerId: string, event: unknown) => void,
): ReactElement {
	if (typeof node === "string") {
		return <>{node}</>;
	}

	const { type, props, children } = node;

	const transformedProps: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(props)) {
		if (typeof value === "object" && value !== null && "$handler" in value) {
			transformedProps[key] = (e: unknown) => {
				onEvent?.((value as { $handler: string }).$handler, e);
			};
		} else {
			transformedProps[key] = value;
		}
	}

	const tagName = elementMap[type] || "div";

	const childElements = children.map((child) => renderNode(child, onEvent));

	return React.createElement(tagName, transformedProps, childElements);
}

export function JsonNode({ node, onEvent }: JsonNodeProps): ReactElement {
	return renderNode(node, onEvent);
}

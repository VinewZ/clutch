import React, { type ReactElement } from "react";
import { lookupComponent } from "@/components/raycast/registry";
import { resolveColor } from "@/lib/clutch-colors";
import { filterHtmlProps } from "@/lib/filter-html-props";
import { resolveIcon } from "@/lib/resolve-icon";

export interface JsonNodeData {
	type: string;
	props: Record<string, unknown>;
	children: (JsonNodeData | TextJsonNodeData)[];
	id: string;
}

export interface TextJsonNodeData {
	type: "TEXT";
	props: { text: string };
	children: never[];
	id: string;
}

const COLOR_PROPS = new Set(["tintColor", "color", "backgroundColor"]);
const ICON_PROPS = new Set(["icon"]);

function isRenderable(value: unknown): boolean {
	if (typeof value === "function") return true;
	if (typeof value === "object" && value !== null) {
		const obj = value as Record<string, unknown>;
		return typeof obj.$$typeof === "symbol" || typeof obj.render === "function";
	}
	return false;
}

function resolveIconValue(value: unknown): unknown {
	if (value == null) return value;

	if (typeof value === "string") {
		const resolved = resolveIcon(value);
		if (isRenderable(resolved)) return resolved;
		return value;
	}

	if (typeof value === "object" && value !== null) {
		const obj = value as Record<string, unknown>;
		if (typeof obj.source === "string") {
			const resolved = resolveIcon(obj.source);
			if (isRenderable(resolved)) {
				const result: Record<string, unknown> = { source: resolved };
				if (obj.tintColor)
					result.tintColor = resolveColor(obj.tintColor as string);
				if (obj.tooltip) result.tooltip = obj.tooltip;
				return result;
			}
		}
	}

	return value;
}

export function renderJsonNode(
	node: JsonNodeData | TextJsonNodeData,
	onEvent?: (handlerId: string, event: unknown) => void,
): ReactElement {
	if (node.type === "TEXT") {
		return <>{(node as TextJsonNodeData).props.text}</>;
	}

	const { type, props: rawProps, children: rawChildren } = node as JsonNodeData;
	const props = rawProps ?? {};
	const children = rawChildren ?? [];

	const Component = lookupComponent(type);
	if (Component) {
		return <Component node={node as JsonNodeData} onEvent={onEvent} />;
	}

	const transformedProps: Record<string, unknown> = {};
	const filteredProps = filterHtmlProps(props);

	for (const [key, value] of Object.entries(filteredProps)) {
		if (typeof value === "object" && value !== null && "$handler" in value) {
			transformedProps[key] = (e: unknown) => {
				onEvent?.((value as { $handler: string }).$handler, e);
			};
		} else if (COLOR_PROPS.has(key) && typeof value === "string") {
			transformedProps[key] = resolveColor(value);
		} else if (ICON_PROPS.has(key)) {
			transformedProps[key] = resolveIconValue(value);
		} else {
			transformedProps[key] = value;
		}
	}

	const childElements = children.map((child) => renderJsonNode(child, onEvent));

	return React.createElement(
		"div",
		{ ...transformedProps, "data-unknown-type": type },
		childElements,
	);
}

export function renderJsonChildren(
	children: (JsonNodeData | TextJsonNodeData)[],
	onEvent?: (handlerId: string, event: unknown) => void,
): ReactElement[] {
	return children.map((child) => renderJsonNode(child, onEvent));
}

interface JsonNodeProps {
	node: JsonNodeData | TextJsonNodeData;
	onEvent?: (handlerId: string, event: unknown) => void;
}

export function JsonNode({ node, onEvent }: JsonNodeProps): ReactElement {
	return renderJsonNode(node, onEvent);
}

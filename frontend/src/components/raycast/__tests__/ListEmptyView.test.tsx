import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ListEmptyView } from "../ListEmptyView";
import type { RaycastComponentProps } from "../types";

function makeNode(
	props: Record<string, unknown>,
	children: unknown[] = [],
): RaycastComponentProps["node"] {
	return {
		type: "List.EmptyView",
		props,
		children,
		id: "test-empty-view",
	};
}

describe("ListEmptyView", () => {
	it("renders icon, title, and description props", () => {
		const node = makeNode({
			icon: "lucide:hourglass",
			title: "No items found",
			description: "Try a different search term",
		});

		render(<ListEmptyView node={node} />);

		expect(screen.getByText("No items found")).toBeInTheDocument();
		expect(screen.getByText("Try a different search term")).toBeInTheDocument();
	});

	it("renders title only without icon or description", () => {
		const node = makeNode({ title: "Empty" });
		render(<ListEmptyView node={node} />);

		expect(screen.getByText("Empty")).toBeInTheDocument();
	});

	it("renders children fallback when no props set", () => {
		const textNode = {
			type: "TEXT",
			props: { text: "No results available" },
			children: [] as never[],
			id: "text-1",
		};
		const node = makeNode({}, [textNode]);

		render(<ListEmptyView node={node} />);

		expect(screen.getByText("No results available")).toBeInTheDocument();
	});

	it("renders string icon reference as SVG", () => {
		const node = makeNode({
			icon: "lucide:hourglass",
			title: "Loading...",
		});

		const { container } = render(<ListEmptyView node={node} />);

		expect(container.querySelector("svg")).toBeInTheDocument();
		expect(screen.getByText("Loading...")).toBeInTheDocument();
	});

	it("prefers props over children when both exist", () => {
		const textNode = {
			type: "TEXT",
			props: { text: "child text" },
			children: [] as never[],
			id: "text-1",
		};
		const node = makeNode({ title: "Prop title" }, [textNode]);

		render(<ListEmptyView node={node} />);

		expect(screen.getByText("Prop title")).toBeInTheDocument();
	});
});

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { List } from "../List";
import type { RaycastComponentProps } from "../types";

function makeListNode(
	props: Record<string, unknown>,
	children: unknown[] = [],
): RaycastComponentProps["node"] {
	return {
		type: "List",
		props,
		children,
		id: "test-list",
	};
}

function makeItemNode(
	id: string,
	props: Record<string, unknown>,
): RaycastComponentProps["node"] {
	return {
		type: "List.Item",
		props,
		children: [],
		id,
	};
}

function makeEmptyViewNode(
	props: Record<string, unknown>,
): RaycastComponentProps["node"] {
	return {
		type: "List.EmptyView",
		props,
		children: [],
		id: "empty-view-1",
	};
}

function makeDropdownNode(
	props: Record<string, unknown>,
	children: unknown[] = [],
): RaycastComponentProps["node"] {
	return {
		type: "Slot",
		props: { name: "searchBarAccessory" },
		children: [
			{
				type: "List.Dropdown",
				props,
				children,
				id: "dropdown-1",
			},
		],
		id: "slot-dropdown",
	};
}

describe("List", () => {
	describe("EmptyView visibility", () => {
		it("shows EmptyView when isLoading=false and no items", () => {
			const emptyView = makeEmptyViewNode({
				title: "No results",
			});
			const node = makeListNode({ isLoading: false }, [emptyView]);

			render(<List node={node} />);

			expect(screen.getByText("No results")).toBeInTheDocument();
		});

		it("hides EmptyView when isLoading=true and no search text", () => {
			const emptyView = makeEmptyViewNode({
				title: "No results",
			});
			const node = makeListNode({ isLoading: true }, [emptyView]);

			render(<List node={node} />);

			expect(screen.queryByText("No results")).not.toBeInTheDocument();
		});
	});

	describe("loading indicator", () => {
		it("shows loading bar when isLoading=true", () => {
			const node = makeListNode({ isLoading: true }, []);
			const { container } = render(<List node={node} />);

			const loadingBar = container.querySelector("[class*='loading-bar']");
			expect(loadingBar).toBeInTheDocument();
		});

		it("does not show loading bar when isLoading=false", () => {
			const node = makeListNode({ isLoading: false }, []);
			const { container } = render(<List node={node} />);

			const loadingBar = container.querySelector("[class*='loading-bar']");
			expect(loadingBar).not.toBeInTheDocument();
		});
	});

	it("does not show loading bar when isLoading=false", () => {
		const node = makeListNode({ isLoading: false }, []);
		const { container } = render(<List node={node} />);

		const loadingBar = container.querySelector(".animate-\\[loading-bar");
		expect(loadingBar).not.toBeInTheDocument();
	});
});

describe("search bar accessory", () => {
	it("renders dropdown in the search bar row", () => {
		const dropdown = makeDropdownNode({ value: "en", tooltip: "Language" }, [
			{
				type: "List.Dropdown.Item",
				props: { title: "English", value: "en" },
				children: [],
				id: "dd-item-1",
			},
		]);
		const node = makeListNode({}, [dropdown]);

		const { container } = render(<List node={node} />);

		const searchRow = container.querySelector(".sticky.top-0");
		expect(searchRow).toBeInTheDocument();

		const select = searchRow?.querySelector("select");
		expect(select).toBeInTheDocument();
	});
});

describe("search text change", () => {
	it("dispatches onEvent with handler id and search text", () => {
		const onEvent = vi.fn();
		const handlerId = "onSearchTextChange-handler-1";
		const node = makeListNode(
			{
				onSearchTextChange: { $handler: handlerId },
			},
			[],
		);

		render(<List node={node} onEvent={onEvent} />);

		const input = screen.getByPlaceholderText("Search...");
		fireEvent.change(input, { target: { value: "hello" } });

		expect(onEvent).toHaveBeenCalledWith(handlerId, {
			searchText: "hello",
		});
	});
});

describe("item rendering", () => {
	it("renders list items with title and subtitle", () => {
		const item1 = makeItemNode("item-1", {
			title: "Item One",
			subtitle: "First item",
		});
		const item2 = makeItemNode("item-2", {
			title: "Item Two",
		});
		const node = makeListNode({}, [item1, item2]);

		render(<List node={node} />);

		expect(screen.getByText("Item One")).toBeInTheDocument();
		expect(screen.getByText("First item")).toBeInTheDocument();
		expect(screen.getByText("Item Two")).toBeInTheDocument();
	});
});

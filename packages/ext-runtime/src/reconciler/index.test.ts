import React from "react";
import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearAllHandlers, executeHandler } from "./handler-registry";
import { createReconciler } from "./index";
import type { JSONNode, TextJSONNode } from "./types";

function waitForRender(element: React.ReactElement): Promise<JSONNode | null> {
	return new Promise((resolve) => {
		const renderer = createReconciler({
			extensionId: "test",
			onUpdate: (json) => {
				resolve(json);
			},
		});
		renderer.render(element);
		renderer.flushSync();
	});
}

describe("Reconciler", () => {
	beforeEach(() => {
		vi.spyOn(console, "error").mockImplementation(() => {});
	});

	it("should create instance for simple host element", async () => {
		const element = React.createElement("div", null, "Hello");
		const result = await waitForRender(element);

		expect(result).not.toBeNull();
		expect(result?.type).toBe("div");
		expect(result?.children).toHaveLength(1);
		const textChild = result?.children?.[0] as TextJSONNode | undefined;
		expect(textChild?.type).toBe("TEXT");
		expect(textChild?.props?.text).toBe("Hello");
	});

	it("should create instance for nested elements", async () => {
		const element = React.createElement(
			"div",
			{ id: "root" },
			React.createElement("span", null, "child"),
		);

		const result = await waitForRender(element);

		expect(result).not.toBeNull();
		expect(result?.type).toBe("div");
		expect(result?.children).toHaveLength(1);
		expect((result?.children[0] as { type: string })?.type).toBe("span");
	});

	it("should create instance for function component", async () => {
		const Component = () => React.createElement("div", null, "From Component");
		const element = React.createElement(Component);

		const result = await waitForRender(element);

		expect(result).not.toBeNull();
		expect(result?.type).toBe("div");
	});

	it("should handle context provider", async () => {
		const ctx = React.createContext({ value: "test" });
		const element = React.createElement(
			ctx.Provider,
			{ value: { value: "provided" } },
			React.createElement("div", null, "child"),
		);

		const result = await waitForRender(element);

		expect(result).not.toBeNull();
	});

	it("should handle fragment as root with single child", async () => {
		const element = React.createElement(
			React.Fragment,
			null,
			React.createElement("span", null, "only"),
		);

		const result = await waitForRender(element);

		expect(result).not.toBeNull();
		expect(result?.type).toBe("span");
	});

	it("should handle fragment as root with multiple children", async () => {
		const element = React.createElement(
			React.Fragment,
			null,
			React.createElement("span", null, "first"),
			React.createElement("span", null, "second"),
		);

		const result = await waitForRender(element);

		expect(result).not.toBeNull();
		expect(result?.type).toBe("FragmentContainer");
		expect(result?.children).toHaveLength(2);
		expect((result?.children[0] as { type: string })?.type).toBe("span");
		expect((result?.children[1] as { type: string })?.type).toBe("span");
	});

	it("should flatten fragments inside parent element", async () => {
		const FragmentParent = () =>
			React.createElement(
				"div",
				null,
				React.createElement(
					React.Fragment,
					null,
					React.createElement("span", { key: "a" }, "first"),
					React.createElement("span", { key: "b" }, "second"),
				),
				React.createElement("span", { key: "c" }, "third"),
			);

		const result = await waitForRender(React.createElement(FragmentParent));

		expect(result).not.toBeNull();
		expect(result?.type).toBe("div");
		expect(result?.children).toHaveLength(3);
		expect((result?.children[0] as { type: string })?.type).toBe("span");
		expect((result?.children[1] as { type: string })?.type).toBe("span");
		expect((result?.children[2] as { type: string })?.type).toBe("span");
	});

	it("should handle nested function components", async () => {
		const Inner = ({ children }: { children: React.ReactNode }) =>
			React.createElement("section", null, children);
		const Outer = () =>
			React.createElement(Inner, null, React.createElement("p", null, "text"));

		const element = React.createElement(Outer);
		const result = await waitForRender(element);

		expect(result).not.toBeNull();
		expect(result?.type).toBe("section");
	});

	it("should handle function component with props", async () => {
		const Inner = ({ title }: { title: string }) =>
			React.createElement("div", null, title);

		const element = React.createElement(Inner, { title: "Hello" });
		const result = await waitForRender(element);

		expect(result).not.toBeNull();
		expect(result?.type).toBe("div");
	});

	it("should handle deeply nested components", async () => {
		const Leaf = () => React.createElement("span", null, "leaf");
		const Middle = () =>
			React.createElement("div", null, React.createElement(Leaf));
		const Root = () =>
			React.createElement("section", null, React.createElement(Middle));

		const element = React.createElement(Root);
		const result = await waitForRender(element);

		expect(result).not.toBeNull();
		expect(result?.type).toBe("section");
	});

	it("should handle function with children prop", async () => {
		const Inner = ({ children }: { children: React.ReactNode }) =>
			React.createElement("section", null, children);
		const Outer = () =>
			React.createElement(Inner, null, React.createElement("p", null, "text"));

		const element = React.createElement(Outer);
		const result = await waitForRender(element);

		expect(result).not.toBeNull();
		expect(result?.type).toBe("section");
	});

	it("should handle two level function nesting", async () => {
		const Inner = () => React.createElement("div", null, "works");
		const Outer = () => React.createElement(Inner);

		const element = React.createElement(Outer);
		const result = await waitForRender(element);

		expect(result).not.toBeNull();
		expect(result?.type).toBe("div");
	});

	it("should handle function receiving children directly", async () => {
		const Container = ({ children }: { children: React.ReactNode }) =>
			React.createElement("div", null, children);
		const element = React.createElement(
			Container,
			null,
			React.createElement("span", null, "test"),
		);

		const result = await waitForRender(element);

		expect(result).not.toBeNull();
		expect(result?.type).toBe("div");
	});

	describe("resetAfterCommit", () => {
		it("should call onUpdate on initial render", async () => {
			const element = React.createElement("div", null, "Hello");
			const result = await waitForRender(element);

			expect(result).not.toBeNull();
			expect(result?.type).toBe("div");
		});

		it("should call onUpdate on re-render via useState", async () => {
			let setter: ((v: number) => void) | null = null;
			const Counter = () => {
				const [count, setCount] = React.useState(0);
				setter = setCount;
				return React.createElement("div", null, String(count));
			};

			const updates: (JSONNode | null)[] = [];
			const renderer = createReconciler({
				extensionId: "test",
				onUpdate: (json) => {
					updates.push(json);
				},
			});

			renderer.render(React.createElement(Counter));
			renderer.flushSync();

			expect(updates.length).toBeGreaterThanOrEqual(1);
			expect(updates[0]?.type).toBe("div");
			const textChild = updates[0]?.children?.[0] as TextJSONNode | undefined;
			expect(textChild?.type).toBe("TEXT");
			expect(textChild?.props?.text).toBe("0");

			const firstCount = updates.length;

			expect(setter).not.toBeNull();
			setter!(1);
			renderer.flushSync();

			expect(updates.length).toBeGreaterThan(firstCount);
			const lastUpdate = updates[updates.length - 1];
			const lastTextChild = lastUpdate?.children?.[0] as
				| TextJSONNode
				| undefined;
			expect(lastTextChild?.props?.text).toBe("1");
		});

		it("should call onUpdate on unmount", async () => {
			const updates: (JSONNode | null)[] = [];
			const renderer = createReconciler({
				extensionId: "test",
				onUpdate: (json) => {
					updates.push(json);
				},
			});

			renderer.render(React.createElement("div", null, "Hello"));
			renderer.flushSync();

			const countBeforeUnmount = updates.length;
			renderer.unmount();
			renderer.flushSync();

			expect(updates.length).toBeGreaterThan(countBeforeUnmount);
			const lastUpdate = updates[updates.length - 1];
			expect(lastUpdate).toBeNull();
		});
	});

	describe("commitUpdate", () => {
		it("should produce updated props on re-render", async () => {
			let setter: ((v: string) => void) | null = null;
			const PropChanger = () => {
				const [value, setValue] = React.useState("initial");
				setter = setValue;
				return React.createElement("div", { "data-value": value });
			};

			const updates: (JSONNode | null)[] = [];
			const renderer = createReconciler({
				extensionId: "test",
				onUpdate: (json) => {
					updates.push(json);
				},
			});

			renderer.render(React.createElement(PropChanger));
			renderer.flushSync();

			const initial = updates[0];
			expect(initial?.props?.["data-value"]).toBe("initial");

			setter!("updated");
			renderer.flushSync();

			const last = updates[updates.length - 1];
			expect(last?.props?.["data-value"]).toBe("updated");
		});
	});

	describe("handler prop serialization", () => {
		it("should replace function props with handler references", async () => {
			const handler = () => {};
			const element = React.createElement("button", {
				type: "button",
				onClick: handler,
			});

			const result = await waitForRender(element);

			expect(result).not.toBeNull();
			expect(result?.props?.onClick).toHaveProperty("$handler");
			expect(
				typeof (result?.props?.onClick as { $handler: string })?.$handler,
			).toBe("string");
		});

		it("should register handlers with unique IDs", async () => {
			const handler1 = () => {};
			const handler2 = () => {};
			const element = React.createElement("div", {
				onClick: handler1,
				onChange: handler2,
			});

			const result = await waitForRender(element);

			expect(result).not.toBeNull();
			const onClickRef = result?.props?.onClick as
				| { $handler: string }
				| undefined;
			const onChangeRef = result?.props?.onChange as
				| { $handler: string }
				| undefined;

			expect(onClickRef?.$handler).toBeTruthy();
			expect(onChangeRef?.$handler).toBeTruthy();
			expect(onClickRef?.$handler).not.toBe(onChangeRef?.$handler);
		});
	});

	describe("event extraction", () => {
		beforeEach(() => {
			clearAllHandlers();
		});

		it("should extract searchText for onSearchTextChange", async () => {
			const received: unknown[] = [];
			const handler = (value?: unknown) => {
				received.push(value);
			};

			const element = React.createElement("div", {
				onSearchTextChange: handler,
			});

			const result = await waitForRender(element);
			const handlerRef = result?.props?.onSearchTextChange as
				| { $handler: string }
				| undefined;

			expect(handlerRef?.$handler).toBeTruthy();
			await executeHandler(handlerRef?.$handler as string, {
				searchText: "hello",
			});

			expect(received).toEqual(["hello"]);
		});

		it("should extract value for onChange", async () => {
			const received: unknown[] = [];
			const handler = (value?: unknown) => {
				received.push(value);
			};

			const element = React.createElement("div", {
				onChange: handler,
			});

			const result = await waitForRender(element);
			const handlerRef = result?.props?.onChange as
				| { $handler: string }
				| undefined;

			expect(handlerRef?.$handler).toBeTruthy();
			await executeHandler(handlerRef?.$handler as string, {
				value: "en",
			});

			expect(received).toEqual(["en"]);
		});

		it("should call onAction with no arguments", async () => {
			const received: unknown[] = [];
			const handler = (value?: unknown) => {
				received.push(value);
			};

			const element = React.createElement("div", {
				onAction: handler,
			});

			const result = await waitForRender(element);
			const handlerRef = result?.props?.onAction as
				| { $handler: string }
				| undefined;

			expect(handlerRef?.$handler).toBeTruthy();
			await executeHandler(handlerRef?.$handler as string, {});

			expect(received).toEqual([undefined]);
		});

		it("should extract formValues for onSubmit", async () => {
			const received: unknown[] = [];
			const handler = (value?: unknown) => {
				received.push(value);
			};

			const element = React.createElement("div", {
				onSubmit: handler,
			});

			const result = await waitForRender(element);
			const handlerRef = result?.props?.onSubmit as
				| { $handler: string }
				| undefined;

			expect(handlerRef?.$handler).toBeTruthy();
			await executeHandler(handlerRef?.$handler as string, {
				formValues: { query: "test" },
			});

			expect(received).toEqual([{ query: "test" }]);
		});

		it("should pass event as-is for unknown prop names", async () => {
			const received: unknown[] = [];
			const handler = (value?: unknown) => {
				received.push(value);
			};

			const element = React.createElement("div", {
				onCustom: handler,
			});

			const result = await waitForRender(element);
			const handlerRef = result?.props?.onCustom as
				| { $handler: string }
				| undefined;

			expect(handlerRef?.$handler).toBeTruthy();
			await executeHandler(handlerRef?.$handler as string, { data: "test" });

			expect(received).toEqual([{ data: "test" }]);
		});
	});

	describe("array children from .map() inside wrapper component", () => {
		it("should not produce TEXT nodes with array indices when wrapper flattens children", async () => {
			const Slot = ({
				children,
				name,
			}: {
				children?: React.ReactNode;
				name?: string;
			}) => React.createElement("Slot", { name }, children);
			const Wrapper = ({
				children,
				accessory,
			}: {
				children?: React.ReactNode;
				accessory?: React.ReactNode;
			}) => {
				const flatChildren: React.ReactNode[] = Array.isArray(children)
					? (children as React.ReactNode[])
					: children
						? [children]
						: [];
				const slots = accessory
					? [
							React.createElement(
								Slot,
								{ key: "slot-0", name: "accessory" },
								accessory,
							),
						]
					: [];
				return React.createElement("List", null, ...flatChildren, ...slots);
			};

			const items = ["en", "fr", "de"];
			const element = React.createElement(
				Wrapper,
				{ accessory: React.createElement("Dropdown", null) },
				items.map((lang) =>
					React.createElement("List.Item", { key: lang, title: lang }),
				),
			);

			const result = await waitForRender(element);

			expect(result).not.toBeNull();
			expect(result?.type).toBe("List");
			const textChildren = result?.children?.filter(
				(c) => (c as { type: string })?.type === "TEXT",
			);
			expect(textChildren).toHaveLength(0);
			const itemChildren = result?.children?.filter(
				(c) => (c as { type: string })?.type === "List.Item",
			);
			expect(itemChildren).toHaveLength(3);
		});
	});

	describe("translate extension pattern: slotted component + jsx/jsxs Fragment with .map()", () => {
		it("should render List.Item children from Fragment-wrapped .map() inside slotted List", async () => {
			const createComponent = (type: string) => {
				const C = (props: {
					children?: React.ReactNode;
					[k: string]: unknown;
				}) => jsx(type as React.ElementType, props as Record<string, unknown>);
				C.displayName = type;
				return C;
			};
			const createSlottedComponent = <P extends string>(
				type: string,
				slotProps: readonly P[],
			) => {
				const Slot = createComponent("Slot");
				const C = (props: Record<string, unknown>) => {
					const { children, ...rest } = props;
					const slots = slotProps
						.filter((prop) => rest[prop])
						.map((prop, i) =>
							React.createElement(
								Slot,
								{ key: `slot-${String(prop)}-${i}`, name: String(prop) },
								rest[prop] as React.ReactNode,
							),
						);
					for (const prop of slotProps) delete rest[prop];
					const flatChildren: React.ReactNode[] = Array.isArray(children)
						? (children as React.ReactNode[])
						: children
							? [children as React.ReactNode]
							: [];
					return jsx(type as React.ElementType, {
						...rest,
						children: [...flatChildren, ...slots],
					});
				};
				C.displayName = type;
				return C;
			};

			const List = createSlottedComponent("List", [
				"searchBarAccessory",
			] as const);
			const ListItem = createSlottedComponent("List.Item", [
				"actions",
				"detail",
			] as const);

			const TranslationResults = ({ results }: { results: string[] }) => {
				return jsx(Fragment, {
					children: results.map((r, i) => jsxs(ListItem, { title: r }, i)),
				});
			};

			const App = () => {
				const results = ["hello - en", "bonjour - fr"];
				return jsx(List, {
					searchBarPlaceholder: "Enter text to translate",
					children: jsx(TranslationResults, { results }),
				});
			};

			const result = await waitForRender(jsx(App, {}));

			expect(result).not.toBeNull();
			expect(result?.type).toBe("List");
			const itemChildren = result?.children?.filter(
				(c) => (c as { type: string })?.type === "List.Item",
			);
			expect(itemChildren).toHaveLength(2);
			const textChildren = result?.children?.filter(
				(c) => (c as { type: string })?.type === "TEXT",
			);
			expect(textChildren).toHaveLength(0);
		});
	});

	describe("reactivity via event extraction", () => {
		beforeEach(() => {
			clearAllHandlers();
		});

		it("should trigger re-render when onSearchTextChange handler is a useState setter", async () => {
			const SearchComponent = () => {
				const [searchText, setSearchText] = React.useState("");
				return React.createElement("div", {
					onSearchTextChange: setSearchText,
					"data-search": searchText,
				});
			};

			const updates: (JSONNode | null)[] = [];
			const renderer = createReconciler({
				extensionId: "test",
				onUpdate: (json) => {
					updates.push(json);
				},
			});

			renderer.render(React.createElement(SearchComponent));
			renderer.flushSync();

			expect(updates.length).toBeGreaterThanOrEqual(1);
			expect(updates[0]?.props?.["data-search"]).toBe("");

			const handlerRef = updates[0]?.props?.onSearchTextChange as
				| { $handler: string }
				| undefined;
			expect(handlerRef?.$handler).toBeTruthy();

			await executeHandler(handlerRef?.$handler as string, {
				searchText: "hello",
			});
			renderer.flushSync();

			const lastUpdate = updates[updates.length - 1];
			expect(lastUpdate?.props?.["data-search"]).toBe("hello");
		});
	});
});

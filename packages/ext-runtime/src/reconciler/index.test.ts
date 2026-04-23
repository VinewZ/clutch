import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
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

	it("should handle fragment", async () => {
		const element = React.createElement(
			React.Fragment,
			null,
			React.createElement("span", null, "first"),
			React.createElement("span", null, "second"),
		);

		const result = await waitForRender(element);

		expect(result).not.toBeNull();
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
});

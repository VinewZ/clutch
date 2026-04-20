import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { createReconciler, resetState } from "./index";

describe("Reconciler", () => {
	beforeEach(() => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		resetState();
	});

	it("should create instance for simple host element", () => {
		const element = React.createElement("div", null, "Hello");
		const renderer = createReconciler();
		const result = renderer.render(element);

		expect(result).not.toBeNull();
		expect(result?.type).toBe("div");
		expect(result?.children).toHaveLength(1);
	});

	it("should create instance for nested elements", () => {
		const element = React.createElement(
			"div",
			{ id: "root" },
			React.createElement("span", null, "child"),
		);

		const renderer = createReconciler();
		const result = renderer.render(element);

		expect(result).not.toBeNull();
		expect(result?.type).toBe("div");
		expect(result?.children).toHaveLength(1);
		expect((result?.children[0] as { type: string })?.type).toBe("span");
	});

	it("should create instance for function component", () => {
		const Component = () => React.createElement("div", null, "From Component");
		const element = React.createElement(Component);

		const renderer = createReconciler();
		const result = renderer.render(element);

		expect(result).not.toBeNull();
		expect(result?.type).toBe("div");
	});

	it("should handle context provider", () => {
		const ctx = React.createContext({ value: "test" });
		const element = React.createElement(
			ctx.Provider,
			{ value: { value: "provided" } },
			React.createElement("div", null, "child"),
		);

		const renderer = createReconciler();
		const result = renderer.render(element);

		expect(result).not.toBeNull();
	});

	it("should handle fragment", () => {
		const element = React.createElement(
			React.Fragment,
			null,
			React.createElement("span", null, "first"),
			React.createElement("span", null, "second"),
		);

		const renderer = createReconciler();
		const result = renderer.render(element);

		expect(result).not.toBeNull();
	});

	it("should handle nested function components", () => {
		const Inner = ({ children }: { children: React.ReactNode }) =>
			React.createElement("section", null, children);
		const Outer = () =>
			React.createElement(Inner, null, React.createElement("p", null, "text"));

		const element = React.createElement(Outer);
		const renderer = createReconciler();
		const result = renderer.render(element);

		expect(result).not.toBeNull();
		expect(result?.type).toBe("section");
	});

	it("should handle function component with props", () => {
		const Inner = ({ title }: { title: string }) =>
			React.createElement("div", null, title);

		const element = React.createElement(Inner, { title: "Hello" });
		const renderer = createReconciler();
		const result = renderer.render(element);

		expect(result).not.toBeNull();
		expect(result?.type).toBe("div");
	});

	it("should handle deeply nested components", () => {
		const Leaf = () => React.createElement("span", null, "leaf");
		const Middle = () =>
			React.createElement("div", null, React.createElement(Leaf));
		const Root = () =>
			React.createElement("section", null, React.createElement(Middle));

		const element = React.createElement(Root);
		const renderer = createReconciler();
		const result = renderer.render(element);

		expect(result).not.toBeNull();
		expect(result?.type).toBe("section");
	});

	it("should handle function with children prop", () => {
		const Inner = ({ children }: { children: React.ReactNode }) =>
			React.createElement("section", null, children);
		const Outer = () =>
			React.createElement(Inner, null, React.createElement("p", null, "text"));

		const element = React.createElement(Outer);
		const renderer = createReconciler();
		const result = renderer.render(element);

		expect(result).not.toBeNull();
		expect(result?.type).toBe("section");
	});

	it("should handle two level function nesting", () => {
		const Inner = () => React.createElement("div", null, "works");
		const Outer = () => React.createElement(Inner);

		const element = React.createElement(Outer);
		const renderer = createReconciler();
		const result = renderer.render(element);

		expect(result).not.toBeNull();
		expect(result?.type).toBe("div");
	});

	it("should handle function receiving children directly", () => {
		const Container = ({ children }: { children: React.ReactNode }) =>
			React.createElement("div", null, children);
		const element = React.createElement(
			Container,
			null,
			React.createElement("span", null, "test"),
		);

		const renderer = createReconciler();
		const result = renderer.render(element);

		expect(result).not.toBeNull();
		expect(result?.type).toBe("div");
	});
});

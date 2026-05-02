import { describe, expect, it } from "vitest";
import { renderIcon } from "../../components/raycast/List";
import { resolveIcon } from "../resolve-icon";

describe("resolveIcon", () => {
	it("resolves lucide:hourglass to a renderable component", () => {
		const result = resolveIcon("lucide:hourglass");
		expect(result).not.toBeUndefined();
		expect(typeof result === "function" || typeof result === "object").toBe(
			true,
		);
	});

	it("resolves lucide:search to a renderable component", () => {
		const result = resolveIcon("lucide:search");
		expect(result).not.toBeUndefined();
		expect(typeof result === "function" || typeof result === "object").toBe(
			true,
		);
	});

	it("returns undefined for lucide:nonexistent", () => {
		const result = resolveIcon("lucide:nonexistent");
		expect(result).toBeUndefined();
	});

	it("returns undefined for null", () => {
		const result = resolveIcon(null);
		expect(result).toBeUndefined();
	});

	it("returns undefined for undefined", () => {
		const result = resolveIcon(undefined);
		expect(result).toBeUndefined();
	});

	it("returns the string for non-lucide strings", () => {
		const result = resolveIcon("emoji");
		expect(result).toBe("emoji");
	});
});

describe("renderIcon", () => {
	it("renders lucide:hourglass string icon as React element", () => {
		const result = renderIcon("lucide:hourglass");
		expect(result).not.toBeNull();
	});

	it("renders lucide:search string icon as React element", () => {
		const result = renderIcon("lucide:search");
		expect(result).not.toBeNull();
	});

	it("returns null for lucide:nonexistent string", () => {
		const result = renderIcon("lucide:nonexistent");
		expect(result).toBeNull();
	});

	it("renders function icon component", () => {
		const MockIcon = (_props: { size?: number; className?: string }) => null;
		const result = renderIcon(MockIcon);
		expect(result).not.toBeNull();
	});

	it("renders {source: Function} icon object", () => {
		const MockIcon = (_props: { size?: number; className?: string }) => null;
		const result = renderIcon({ source: MockIcon });
		expect(result).not.toBeNull();
	});

	it("renders {source: Function, tintColor} icon object", () => {
		const MockIcon = (_props: {
			size?: number;
			className?: string;
			style?: React.CSSProperties;
		}) => null;
		const result = renderIcon({
			source: MockIcon,
			tintColor: "#ff0000",
		});
		expect(result).not.toBeNull();
	});

	it("returns null for null input", () => {
		expect(renderIcon(null)).toBeNull();
	});

	it("returns null for undefined input", () => {
		expect(renderIcon(undefined)).toBeNull();
	});

	it("returns null for empty string", () => {
		expect(renderIcon("")).toBeNull();
	});

	it("returns null for non-lucide string", () => {
		expect(renderIcon("emoji")).toBeNull();
	});
});

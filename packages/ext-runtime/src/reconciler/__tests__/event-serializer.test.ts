import { describe, expect, it } from "vitest";
import { serializeEvent, serializeEventValue } from "../event-serializer";

describe("EventSerializer", () => {
	describe("serializeEvent", () => {
		it("should serialize keyboard-like event object", () => {
			const keyboardEvent = {
				type: "keydown",
				key: "Enter",
				code: "Enter",
				ctrlKey: true,
			};

			const result = serializeEvent(keyboardEvent);

			expect(result.type).toBe("keydown");
			expect(result.key).toBe("Enter");
			expect(result.code).toBe("Enter");
			expect(result.ctrlKey).toBe(true);
		});

		it("should serialize mouse-like event object", () => {
			const mouseEvent = {
				type: "click",
				button: 0,
				clientX: 100,
				clientY: 200,
				shiftKey: true,
			};

			const result = serializeEvent(mouseEvent);

			expect(result.type).toBe("click");
			expect(result.button).toBe(0);
			expect(result.clientX).toBe(100);
			expect(result.clientY).toBe(200);
			expect(result.shiftKey).toBe(true);
		});

		it("should serialize focus-like event object", () => {
			const focusEvent = {
				type: "blur",
			};

			const result = serializeEvent(focusEvent);

			expect(result.type).toBe("blur");
		});

		it("should serialize event target element", () => {
			const targetElement = {
				tagName: "INPUT",
				value: "test value",
				id: "test-input",
			};

			const focusEvent = {
				type: "focus",
				target: targetElement,
			};

			const result = serializeEvent(focusEvent);

			expect(result.target).toBeDefined();
			expect(result.target?.tagName).toBe("input");
			expect(result.target?.value).toBe("test value");
			expect(result.target?.id).toBe("test-input");
		});

		it("should handle null target", () => {
			const event = {
				type: "custom",
				target: null,
			};

			const result = serializeEvent(event);

			expect(result.target).toBeUndefined();
		});

		it("should handle React SyntheticEvent-like object", () => {
			const nativeEvent = {
				type: "click",
				clientX: 50,
				clientY: 75,
				target: null,
			};

			const reactEvent = {
				type: "click",
				nativeEvent,
			};

			const result = serializeEvent(reactEvent);

			expect(result.type).toBe("click");
		});
	});

	describe("serializeEventValue", () => {
		it("should extract value from target", () => {
			const event = {
				target: { value: "input value" },
			};

			const result = serializeEventValue(event);

			expect(result).toBe("input value");
		});

		it("should extract value from currentTarget", () => {
			const event = {
				currentTarget: { value: "current value" },
			};

			const result = serializeEventValue(event);

			expect(result).toBe("current value");
		});

		it("should prefer target over currentTarget", () => {
			const event = {
				target: { value: "target value" },
				currentTarget: { value: "current value" },
			};

			const result = serializeEventValue(event);

			expect(result).toBe("target value");
		});

		it("should return serialized event if no value", () => {
			const event = {
				type: "click",
				target: null,
			};

			const result = serializeEventValue(event);

			expect(result).toHaveProperty("type", "click");
		});
	});
});

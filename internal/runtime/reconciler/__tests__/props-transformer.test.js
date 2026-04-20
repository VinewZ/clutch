import { beforeEach, describe, expect, it } from "vitest";
import { clearAllHandlers, handlerRegistry } from "../handler-registry";
import { getHandlerId, isTransformed, transformProps, } from "../props-transformer";
describe("PropsTransformer", () => {
    beforeEach(() => {
        clearAllHandlers();
    });
    describe("transformProps", () => {
        it("should detect and transform onClick handler", () => {
            const handler = () => ({ type: "CLICK" });
            const props = { onClick: handler, id: "btn" };
            const result = transformProps(props, { extensionId: "ext-1" });
            expect(result.id).toBe("btn");
            expect(result.onClick).toBeDefined();
            expect(isTransformed(result.onClick)).toBe(true);
        });
        it("should detect and transform onChange handler", () => {
            const handler = () => ({ type: "CHANGE" });
            const props = { onChange: handler };
            const result = transformProps(props, { extensionId: "ext-1" });
            expect(isTransformed(result.onChange)).toBe(true);
        });
        it("should register handler with unique ID", () => {
            const handler = () => ({ type: "CLICK" });
            const props = { onClick: handler };
            const result = transformProps(props, { extensionId: "ext-1" });
            const handlerId = getHandlerId(result.onClick);
            expect(handlerId).toMatch(/^handler_\d+$/);
            expect(handlerRegistry.has(handlerId)).toBe(true);
        });
        it("should pass through non-handler props", () => {
            const props = {
                id: "my-button",
                className: "btn-primary",
                disabled: true,
                count: 42,
            };
            const result = transformProps(props, { extensionId: "ext-1" });
            expect(result.id).toBe("my-button");
            expect(result.className).toBe("btn-primary");
            expect(result.disabled).toBe(true);
            expect(result.count).toBe(42);
        });
        it("should skip internal React props", () => {
            const props = {
                children: "Click me",
                key: "btn-1",
                ref: { current: null },
                onClick: () => ({ type: "CLICK" }),
            };
            const result = transformProps(props, { extensionId: "ext-1" });
            expect(result.children).toBe("Click me");
            expect(result.key).toBe("btn-1");
            expect(result.ref).toBe(props.ref);
            expect(isTransformed(result.onClick)).toBe(true);
        });
        it("should be idempotent - handle already transformed handlers", () => {
            const handler = () => ({ type: "CLICK" });
            const props = { onClick: handler };
            const result1 = transformProps(props, { extensionId: "ext-1" });
            const result2 = transformProps(result1, { extensionId: "ext-1" });
            expect(result1.onClick).toEqual(result2.onClick);
        });
        it("should handle multiple event handlers", () => {
            const clickHandler = () => ({ type: "CLICK" });
            const changeHandler = () => ({ type: "CHANGE" });
            const blurHandler = () => ({ type: "BLUR" });
            const props = {
                onClick: clickHandler,
                onChange: changeHandler,
                onBlur: blurHandler,
                id: "input",
            };
            const result = transformProps(props, { extensionId: "ext-1" });
            expect(isTransformed(result.onClick)).toBe(true);
            expect(isTransformed(result.onChange)).toBe(true);
            expect(isTransformed(result.onBlur)).toBe(true);
            expect(result.id).toBe("input");
            expect(getHandlerId(result.onClick)).not.toBe(getHandlerId(result.onChange));
        });
        it("should provide handlers map for inspection", () => {
            const handlers = new Map();
            const handler = () => ({ type: "CLICK" });
            const props = { onClick: handler };
            transformProps(props, { extensionId: "ext-1", handlers });
            expect(handlers.size).toBe(1);
            expect(handlers.has("handler_0")).toBe(true);
        });
    });
    describe("isTransformed", () => {
        it("should return true for handler reference", () => {
            const handlerRef = { $handler: "handler_0" };
            expect(isTransformed(handlerRef)).toBe(true);
        });
        it("should return false for regular function", () => {
            const handler = () => ({ type: "CLICK" });
            expect(isTransformed(handler)).toBe(false);
        });
        it("should return false for null", () => {
            expect(isTransformed(null)).toBe(false);
        });
        it("should return false for non-object", () => {
            expect(isTransformed("onClick")).toBe(false);
            expect(isTransformed(123)).toBe(false);
        });
    });
    describe("getHandlerId", () => {
        it("should extract handler ID from reference", () => {
            const handlerRef = { $handler: "handler_42" };
            expect(getHandlerId(handlerRef)).toBe("handler_42");
        });
    });
});
//# sourceMappingURL=props-transformer.test.js.map
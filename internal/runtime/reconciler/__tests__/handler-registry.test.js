import { beforeEach, describe, expect, it } from "vitest";
import { clearAllHandlers, clearExtensionHandlers, executeHandler, handlerRegistry, registerHandler, } from "../handler-registry";
describe("HandlerRegistry", () => {
    beforeEach(() => {
        clearAllHandlers();
    });
    describe("register", () => {
        it("should register a handler and return unique ID", () => {
            const handler = () => ({ type: "test" });
            const id = registerHandler("ext-1", handler);
            expect(id).toMatch(/^handler_\d+$/);
            expect(handlerRegistry.get(id)).toBe(handler);
        });
        it("should register multiple handlers with unique IDs", () => {
            const handler1 = () => ({ type: "test1" });
            const handler2 = () => ({ type: "test2" });
            const id1 = registerHandler("ext-1", handler1);
            const id2 = registerHandler("ext-1", handler2);
            expect(id1).not.toBe(id2);
            expect(handlerRegistry.get(id1)).toBe(handler1);
            expect(handlerRegistry.get(id2)).toBe(handler2);
        });
    });
    describe("execute", () => {
        it("should execute sync handler and return action", async () => {
            const action = { type: "CLICK", payload: { x: 100 } };
            const handler = () => action;
            const id = registerHandler("ext-1", handler);
            const event = { type: "click" };
            const result = await executeHandler(id, event);
            expect(result).toEqual(action);
        });
        it("should execute async handler and return action", async () => {
            const action = { type: "ASYNC_CLICK" };
            const handler = async () => {
                await new Promise((resolve) => setTimeout(resolve, 10));
                return action;
            };
            const id = registerHandler("ext-1", handler);
            const event = { type: "click" };
            const result = await executeHandler(id, event);
            expect(result).toEqual(action);
        });
        it("should throw error for non-existent handler", async () => {
            const event = { type: "click" };
            await expect(executeHandler("nonexistent", event)).rejects.toThrow("Handler not found: nonexistent");
        });
        it("should pass event to handler", async () => {
            let receivedEvent = null;
            const handler = (event) => {
                receivedEvent = event;
                return { type: "test" };
            };
            const id = registerHandler("ext-1", handler);
            const event = { type: "click", target: { id: "btn" } };
            await executeHandler(id, event);
            expect(receivedEvent).toEqual(event);
        });
    });
    describe("clearExtensionHandlers", () => {
        it("should clear all handlers for an extension", () => {
            const handler1 = () => ({ type: "test1" });
            const handler2 = () => ({ type: "test2" });
            const handler3 = () => ({ type: "test3" });
            const id1 = registerHandler("ext-1", handler1);
            const id2 = registerHandler("ext-1", handler2);
            const id3 = registerHandler("ext-2", handler3);
            clearExtensionHandlers("ext-1");
            expect(handlerRegistry.has(id1)).toBe(false);
            expect(handlerRegistry.has(id2)).toBe(false);
            expect(handlerRegistry.has(id3)).toBe(true);
        });
    });
    describe("has", () => {
        it("should return true for registered handler", () => {
            const handler = () => ({ type: "test" });
            const id = registerHandler("ext-1", handler);
            expect(handlerRegistry.has(id)).toBe(true);
        });
        it("should return false for non-existent handler", () => {
            expect(handlerRegistry.has("nonexistent")).toBe(false);
        });
    });
    describe("remove", () => {
        it("should remove a handler", () => {
            const handler = () => ({ type: "test" });
            const id = registerHandler("ext-1", handler);
            expect(handlerRegistry.remove(id)).toBe(true);
            expect(handlerRegistry.has(id)).toBe(false);
        });
        it("should return false for non-existent handler", () => {
            expect(handlerRegistry.remove("nonexistent")).toBe(false);
        });
    });
    describe("getExtensionHandlers", () => {
        it("should return all handler IDs for an extension", () => {
            const handler1 = () => ({ type: "test1" });
            const handler2 = () => ({ type: "test2" });
            const handler3 = () => ({ type: "test3" });
            const id1 = registerHandler("ext-1", handler1);
            const id2 = registerHandler("ext-1", handler2);
            registerHandler("ext-2", handler3);
            const ids = handlerRegistry.getExtensionHandlers("ext-1");
            expect(ids).toContain(id1);
            expect(ids).toContain(id2);
            expect(ids).toHaveLength(2);
        });
    });
});
//# sourceMappingURL=handler-registry.test.js.map
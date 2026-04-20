class HandlerRegistry {
    handlers = new Map();
    counter = 0;
    register(extensionId, handler) {
        const handlerId = `handler_${this.counter++}`;
        this.handlers.set(handlerId, { handler, extensionId });
        return handlerId;
    }
    get(handlerId) {
        return this.handlers.get(handlerId)?.handler;
    }
    async execute(handlerId, event) {
        const handlerInfo = this.handlers.get(handlerId);
        if (!handlerInfo) {
            throw new Error(`Handler not found: ${handlerId}`);
        }
        const result = handlerInfo.handler(event);
        if (result instanceof Promise) {
            return await result;
        }
        return result;
    }
    has(handlerId) {
        return this.handlers.has(handlerId);
    }
    remove(handlerId) {
        return this.handlers.delete(handlerId);
    }
    clearExtension(extensionId) {
        for (const [id, info] of this.handlers.entries()) {
            if (info.extensionId === extensionId) {
                this.handlers.delete(id);
            }
        }
    }
    clear() {
        this.handlers.clear();
        this.counter = 0;
    }
    getExtensionHandlers(extensionId) {
        const ids = [];
        for (const [id, info] of this.handlers.entries()) {
            if (info.extensionId === extensionId) {
                ids.push(id);
            }
        }
        return ids;
    }
}
export const handlerRegistry = new HandlerRegistry();
export function registerHandler(extensionId, handler) {
    return handlerRegistry.register(extensionId, handler);
}
export function executeHandler(handlerId, event) {
    return handlerRegistry.execute(handlerId, event);
}
export function clearExtensionHandlers(extensionId) {
    handlerRegistry.clearExtension(extensionId);
}
export function clearAllHandlers() {
    handlerRegistry.clear();
}
//# sourceMappingURL=handler-registry.js.map
import { registerHandler } from "./handler-registry";
const EVENT_HANDLER_REGEX = /^on[A-Z]/;
function isEventHandler(key) {
    return EVENT_HANDLER_REGEX.test(key);
}
function isHandlerFunction(value) {
    return typeof value === "function";
}
function isHandlerReference(value) {
    return typeof value === "object" && value !== null && "$handler" in value;
}
export function transformProps(props, options) {
    const result = {};
    const { extensionId, handlers } = options;
    for (const [key, value] of Object.entries(props)) {
        if (key === "children" || key === "key" || key === "ref") {
            result[key] = value;
            continue;
        }
        if (isEventHandler(key) && isHandlerFunction(value)) {
            const handlerId = registerHandler(extensionId, value);
            if (handlers) {
                handlers.set(handlerId, value);
            }
            result[key] = { $handler: handlerId };
            continue;
        }
        if (isEventHandler(key) && isHandlerReference(value)) {
            result[key] = value;
            continue;
        }
        result[key] = value;
    }
    return result;
}
export function isTransformed(value) {
    return isHandlerReference(value);
}
export function getHandlerId(handlerRef) {
    return handlerRef.$handler;
}
//# sourceMappingURL=props-transformer.js.map
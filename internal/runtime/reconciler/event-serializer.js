const KEYBOARD_PROPS = [
    "key",
    "code",
    "keyCode",
    "altKey",
    "ctrlKey",
    "metaKey",
    "shiftKey",
    "repeat",
];
const MOUSE_PROPS = [
    "button",
    "buttons",
    "clientX",
    "clientY",
    "pageX",
    "pageY",
    "screenX",
    "screenY",
    "altKey",
    "ctrlKey",
    "metaKey",
    "shiftKey",
];
function isElementLike(target) {
    return (typeof target === "object" &&
        target !== null &&
        "tagName" in target &&
        typeof target.tagName === "string");
}
function serializeTarget(target) {
    if (!target)
        return undefined;
    const result = {};
    if (isElementLike(target)) {
        result.tagName = target.tagName.toLowerCase();
        if (target.id)
            result.id = target.id;
        if (typeof target.value === "string")
            result.value = target.value;
        if (typeof target.checked === "boolean")
            result.checked = target.checked;
    }
    return Object.keys(result).length > 0 ? result : undefined;
}
function serializeKeyboardEvent(event) {
    const result = {};
    for (const prop of KEYBOARD_PROPS) {
        if (prop in event && event[prop] !== undefined) {
            result[prop] = event[prop];
        }
    }
    return result;
}
function serializeMouseEvent(event) {
    const result = {};
    for (const prop of MOUSE_PROPS) {
        if (prop in event && event[prop] !== undefined) {
            result[prop] = event[prop];
        }
    }
    return result;
}
function isKeyboardEvent(event) {
    return "key" in event || "code" in event;
}
function isMouseEvent(event) {
    return "clientX" in event || "clientY" in event || "button" in event;
}
export function serializeEvent(event) {
    const reactEvent = event;
    const nativeEvent = (reactEvent.nativeEvent ?? event);
    const eventType = reactEvent.type ?? nativeEvent.type ?? "unknown";
    const serialized = {
        type: eventType,
        target: serializeTarget(nativeEvent.target),
    };
    if (isKeyboardEvent(nativeEvent)) {
        Object.assign(serialized, serializeKeyboardEvent(nativeEvent));
    }
    else if (isMouseEvent(nativeEvent)) {
        Object.assign(serialized, serializeMouseEvent(nativeEvent));
    }
    return serialized;
}
export function serializeEventValue(event) {
    const reactEvent = event;
    if (reactEvent.target && "value" in reactEvent.target) {
        return reactEvent.target.value;
    }
    if (reactEvent.currentTarget && "value" in reactEvent.currentTarget) {
        return reactEvent.currentTarget.value;
    }
    return serializeEvent(event);
}
//# sourceMappingURL=event-serializer.js.map
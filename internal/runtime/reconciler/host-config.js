import { instances, getNextInstanceId } from "../state";
function createNode(type, props, id) {
    return {
        type,
        props,
        children: [],
        id: `node_${id}`,
    };
}
function appendChildToParent(parent, child) {
    if (typeof child === "string") {
        if ("type" in parent) {
            parent.children.push(child);
        }
        return;
    }
    if ("type" in parent) {
        const existingIndex = parent.children.findIndex((c) => typeof c === "string" ? false : c.id === child.id);
        if (existingIndex > -1) {
            parent.children.splice(existingIndex, 1);
        }
        parent.children.push(child);
    }
}
function removeChildFromParent(parent, child) {
    if (!("children" in parent))
        return;
    parent.children = parent.children.filter((c) => typeof c === "string" ? c !== child : c.id !== child.id);
}
export const hostConfig = {
    supportsMutation: true,
    supportsPersistence: false,
    supportsHydration: false,
    isPrimaryRenderer: true,
    getPublicInstance(instance) {
        if (typeof instance === "string") {
            return {
                type: "TEXT",
                props: { text: instance },
                children: [],
                id: `text_${Date.now()}`,
            };
        }
        return instance;
    },
    getRootHostContext() {
        return {};
    },
    getChildHostContext() {
        return {};
    },
    prepareForCommit() {
        return null;
    },
    resetAfterCommit() { },
    createInstance(type, props, _rootContainer, _hostContext, internalInstanceHandle) {
        const id = getNextInstanceId();
        const { children, ...restProps } = props;
        const instance = createNode(type, restProps, id);
        internalInstanceHandle.stateNode = instance;
        instances.set(id, instance);
        return instance;
    },
    createTextInstance(text, _rootContainer, _hostContext, _internalInstanceHandle) {
        return text;
    },
    appendInitialChild: appendChildToParent,
    appendChild: appendChildToParent,
    appendChildToContainer(container, child) {
        if (typeof child === "string")
            return;
        container.children.push(child);
    },
    insertBefore(parentInstance, child, beforeChild) {
        const beforeIndex = parentInstance.children.findIndex((c) => typeof c === "string"
            ? c === beforeChild
            : c.id === beforeChild.id);
        if (beforeIndex !== -1) {
            parentInstance.children.splice(beforeIndex, 0, child);
        }
        else {
            parentInstance.children.push(child);
        }
    },
    insertInContainerBefore(container, child, beforeChild) {
        if (typeof child === "string")
            return;
        const beforeIndex = container.children.findIndex((c) => typeof c === "string"
            ? c === beforeChild
            : c.id === beforeChild.id);
        if (beforeIndex !== -1) {
            container.children.splice(beforeIndex, 0, child);
        }
        else {
            container.children.push(child);
        }
    },
    removeChild: removeChildFromParent,
    removeChildFromContainer: removeChildFromParent,
    commitUpdate(instance, _type, _oldProps, newProps) {
        const { children, ...restProps } = newProps;
        instance.props = restProps;
    },
    commitTextUpdate(_textInstance, _oldText, _newText) { },
    finalizeInitialChildren() {
        return false;
    },
    shouldSetTextContent() {
        return false;
    },
    clearContainer(container) {
        container.children = [];
    },
    scheduleTimeout: setTimeout,
    cancelTimeout: (id) => clearTimeout(id),
    noTimeout: -1,
    getCurrentUpdatePriority() {
        return 1;
    },
    setCurrentUpdatePriority() { },
    resolveUpdatePriority() {
        return 1;
    },
    resolveEventTimeStamp() {
        return 0;
    },
    trackSchedulerEvent() { },
    resolveEventType() {
        return null;
    },
    shouldAttemptEagerTransition() {
        return false;
    },
    maySuspendCommit() {
        return false;
    },
    preloadInstance() {
        return true;
    },
    startSuspendingCommit() { },
    suspendInstance() { },
    waitForCommitToBeReady() {
        return null;
    },
    preparePortalMount() { },
    getInstanceFromNode() {
        return null;
    },
    beforeActiveInstanceBlur() { },
    afterActiveInstanceBlur() { },
    prepareScopeUpdate() { },
    getInstanceFromScope() {
        return null;
    },
    detachDeletedInstance() { },
    commitMount() { },
    hideInstance() { },
    hideTextInstance() { },
    unhideInstance() { },
    unhideTextInstance() { },
    resetTextContent() { },
    supportsMicrotasks: true,
    scheduleMicrotask: queueMicrotask,
    resetFormInstance() { },
    requestPostPaintCallback() { },
    NotPendingTransition: null,
    HostTransitionContext: {},
};
export default hostConfig;
//# sourceMappingURL=host-config.js.map
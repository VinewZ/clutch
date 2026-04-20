import { createSocketClient } from "../socket/client";
import { clearExtensionHandlers, executeHandler } from "./handler-registry";
import { clearExtensionContext, setExtensionContext } from "./host-config";
import { resetIdCounter } from "./utils";
export function createSocketBridge(config) {
    let client = null;
    return {
        async start() {
            client = createSocketClient({
                socketPath: config.socketPath,
                timeout: 5000,
            });
            await client.connect();
        },
        async stop() {
            client?.close();
            client = null;
        },
        isConnected() {
            return client?.isConnected() ?? false;
        },
    };
}
export async function handleRuntimeEvent(message) {
    try {
        const action = await executeHandler(message.handlerId, message.event);
        return {
            success: true,
            data: action,
        };
    }
    catch (error) {
        return {
            success: false,
            error: {
                code: "HANDLER_ERROR",
                message: error instanceof Error ? error.message : "Unknown error",
            },
        };
    }
}
export function createRuntimeEventHandler(sendResponse) {
    return async (message) => {
        const response = await handleRuntimeEvent(message);
        sendResponse(response);
    };
}
export function createRenderRequestHandler(render, sendResponse) {
    return async (message) => {
        try {
            setExtensionContext(message.extensionId);
            resetIdCounter();
            const json = render(message.extensionId, message.state);
            const response = {
                success: true,
                data: { json },
            };
            sendResponse(response);
        }
        catch (error) {
            sendResponse({
                success: false,
                error: {
                    code: "RENDER_ERROR",
                    message: error instanceof Error ? error.message : "Unknown error",
                },
            });
        }
        finally {
            clearExtensionContext();
        }
    };
}
export function createRuntimeStartHandler(loadExtension, sendResponse) {
    return async (message) => {
        try {
            await loadExtension(message.extensionPath, message.extensionCommand);
            sendResponse({
                success: true,
                data: { extensionId: message.extensionId },
            });
        }
        catch (error) {
            sendResponse({
                success: false,
                error: {
                    code: "START_ERROR",
                    message: error instanceof Error ? error.message : "Unknown error",
                },
            });
        }
    };
}
export function createRuntimeStopHandler(sendResponse) {
    return async (extensionId) => {
        try {
            clearExtensionHandlers(extensionId);
            clearExtensionContext();
            sendResponse({
                success: true,
                data: { extensionId },
            });
        }
        catch (error) {
            sendResponse({
                success: false,
                error: {
                    code: "STOP_ERROR",
                    message: error instanceof Error ? error.message : "Unknown error",
                },
            });
        }
    };
}
//# sourceMappingURL=socket-bridge.js.map
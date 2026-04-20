import net from "node:net";
export function createSocketClient(config) {
    let socket = null;
    let connected = false;
    let buffer = "";
    const messageHandlers = new Set();
    return {
        async connect() {
            return new Promise((resolve, reject) => {
                console.error("[SOCKET] Creating connection to:", config.socketPath);
                socket = net.createConnection(config.socketPath);
                const connectTimeout = setTimeout(() => {
                    console.error("[SOCKET] Connection timeout");
                    socket?.destroy();
                    reject(new Error("Connection timeout"));
                }, config.timeout ?? 5000);
                socket.once("connect", () => {
                    clearTimeout(connectTimeout);
                    connected = true;
                    console.error("[SOCKET] Connected successfully");
                    resolve();
                });
                socket.once("error", (err) => {
                    clearTimeout(connectTimeout);
                    console.error("[SOCKET] Connection error:", err.message);
                    reject(err);
                });
                socket.on("data", (data) => {
                    buffer += data.toString();
                    let newlineIndex = buffer.indexOf("\n");
                    while (newlineIndex !== -1) {
                        const jsonStr = buffer.slice(0, newlineIndex);
                        buffer = buffer.slice(newlineIndex + 1);
                        try {
                            const parsed = JSON.parse(jsonStr);
                            console.error("[SOCKET] Received message:", JSON.stringify(parsed).slice(0, 200));
                            for (const handler of messageHandlers) {
                                handler(parsed);
                            }
                        }
                        catch {
                            console.error("[SOCKET] Failed to parse message:", jsonStr.slice(0, 100));
                        }
                        newlineIndex = buffer.indexOf("\n");
                    }
                });
                socket.on("close", () => {
                    console.error("[SOCKET] Connection closed");
                    connected = false;
                    socket = null;
                });
                socket.on("error", () => {
                    console.error("[SOCKET] Socket error event");
                    connected = false;
                });
            });
        },
        async send(msg) {
            return new Promise((resolve, reject) => {
                if (!socket || !connected) {
                    console.error("[SOCKET] Cannot send - not connected");
                    reject(new Error("Socket not connected"));
                    return;
                }
                console.error("[SOCKET] Sending message:", JSON.stringify(msg).slice(0, 200));
                const sendTimeout = setTimeout(() => {
                    console.error("[SOCKET] Send timeout");
                    reject(new Error("Response timeout"));
                }, config.timeout ?? 5000);
                let localBuffer = "";
                const onData = (data) => {
                    localBuffer += data.toString();
                    const newlineIndex = localBuffer.indexOf("\n");
                    if (newlineIndex !== -1) {
                        const jsonStr = localBuffer.slice(0, newlineIndex);
                        clearTimeout(sendTimeout);
                        socket?.off("data", onData);
                        try {
                            const response = JSON.parse(jsonStr);
                            console.error("[SOCKET] Received response:", JSON.stringify(response).slice(0, 200));
                            resolve(response);
                        }
                        catch (err) {
                            console.error("[SOCKET] Failed to parse response:", jsonStr.slice(0, 100));
                            reject(new Error(`Parse error: ${err}`));
                        }
                    }
                };
                socket.on("data", onData);
                const jsonStr = `${JSON.stringify(msg)}\n`;
                socket.write(jsonStr, (err) => {
                    if (err) {
                        clearTimeout(sendTimeout);
                        socket?.off("data", onData);
                        console.error("[SOCKET] Write error:", err.message);
                        reject(err);
                    }
                });
            });
        },
        onMessage(handler) {
            messageHandlers.add(handler);
        },
        removeMessageHandler(handler) {
            messageHandlers.delete(handler);
        },
        close() {
            if (socket) {
                console.error("[SOCKET] Closing socket");
                socket.destroy();
                socket = null;
                connected = false;
            }
            messageHandlers.clear();
        },
        isConnected() {
            return connected && socket !== null;
        },
    };
}
//# sourceMappingURL=client.js.map
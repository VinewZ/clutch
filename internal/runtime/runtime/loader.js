import { pathToFileURL } from "node:url";
import React from "react";
export async function loadExtension(extensionPath, command) {
    const entryPath = `${extensionPath}/${command}.js`;
    try {
        const module = (await import(pathToFileURL(entryPath).href));
        let component;
        let defaultExport = module.default;
        // Handle CommonJS modules with nested default
        if (defaultExport &&
            typeof defaultExport === "object" &&
            "default" in defaultExport &&
            !React.isValidElement(defaultExport)) {
            defaultExport = defaultExport.default;
        }
        if (React.isValidElement(defaultExport)) {
            component = defaultExport;
        }
        else if (typeof defaultExport === "function") {
            component = React.createElement(defaultExport);
        }
        else {
            const Wrapper = () => defaultExport;
            component = React.createElement(Wrapper);
        }
        const extensionId = `${extensionPath.split("/").pop()}-${command}`;
        return {
            id: extensionId,
            path: extensionPath,
            command,
            module,
            component,
        };
    }
    catch (error) {
        throw new Error(`Failed to load extension at ${entryPath}: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
}
//# sourceMappingURL=loader.js.map
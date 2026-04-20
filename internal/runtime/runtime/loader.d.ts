import React from "react";
import type { ReactElement } from "react";
export interface ExtensionModule {
    default: React.ReactNode | (() => React.ReactNode) | React.ComponentType;
    [key: string]: unknown;
}
export interface LoadedExtension {
    id: string;
    path: string;
    command: string;
    module: ExtensionModule;
    component: ReactElement;
}
export declare function loadExtension(extensionPath: string, command: string): Promise<LoadedExtension>;
//# sourceMappingURL=loader.d.ts.map
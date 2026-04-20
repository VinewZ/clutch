export const instances = new Map();
export const root = { id: "root", children: [] };
let instanceCounter = 0;
export const getNextInstanceId = () => ++instanceCounter;
export function resetState() {
    instances.clear();
    root.children = [];
    instanceCounter = 0;
}
//# sourceMappingURL=state.js.map
let nodeIdCounter = 0;

export function generateId(): string {
	return `node_${nodeIdCounter++}`;
}

export function resetIdCounter(): void {
	nodeIdCounter = 0;
}

export function shallowEqual(
	objA: Record<string, unknown>,
	objB: Record<string, unknown>,
): boolean {
	if (Object.is(objA, objB)) {
		return true;
	}

	const keysA = Object.keys(objA);
	const keysB = Object.keys(objB);

	if (keysA.length !== keysB.length) {
		return false;
	}

	for (const key of keysA) {
		if (!Object.hasOwn(objB, key) || !Object.is(objA[key], objB[key])) {
			return false;
		}
	}

	return true;
}

export function getComponentName(type: unknown): string {
	if (typeof type === "string") {
		return type;
	}

	if (typeof type === "function") {
		const func = type as { displayName?: string; name?: string };
		return func.displayName || func.name || "Anonymous";
	}

	if (typeof type === "object" && type !== null) {
		const obj = type as { displayName?: string };
		return obj.displayName || "Anonymous";
	}

	return "Unknown";
}

const REF_KEY = "ref";
const KEY_KEY = "key";
const CHILDREN_KEY = "children";

const INTERNAL_PROPS = new Set([REF_KEY, KEY_KEY, CHILDREN_KEY]);

export function extractProps(
	props: Record<string, unknown>,
): Record<string, unknown> {
	const result: Record<string, unknown> = {};

	for (const key of Object.keys(props)) {
		if (!INTERNAL_PROPS.has(key)) {
			result[key] = props[key];
		}
	}

	return result;
}

import type { LucideIcon } from "lucide-react";
import * as LucideIcons from "lucide-react";

const iconCache = new Map<string, LucideIcon | null>();

function kebabToPascal(str: string): string {
	return str
		.split("-")
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join("");
}

export function resolveIcon(value: unknown): LucideIcon | string | undefined {
	if (value == null) return undefined;
	if (typeof value !== "string") return undefined;

	if (value.startsWith("lucide:")) {
		const kebabName = value.slice(7);

		const cached = iconCache.get(kebabName);
		if (cached !== undefined) return cached ?? undefined;
		if (cached === null) return undefined;

		const pascalName = kebabToPascal(kebabName);
		const component = (LucideIcons as Record<string, unknown>)[pascalName] as
			| LucideIcon
			| undefined;

		if (component) {
			iconCache.set(kebabName, component);
			return component;
		}

		iconCache.set(kebabName, null);
		return undefined;
	}

	return value;
}

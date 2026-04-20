export function resolveColor(color: string | undefined): string | undefined {
	if (!color) return undefined;
	if (color.startsWith("clutch-")) {
		return `var(--${color})`;
	}
	return color;
}

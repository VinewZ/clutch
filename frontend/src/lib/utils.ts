import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatCount(num: number): string {
	if (num < 1000) return String(num);
	const tiers = [
		{ value: 1_000_000_000, suffix: "B" },
		{ value: 1_000_000, suffix: "M" },
		{ value: 1_000, suffix: "k" },
	] as const;
	for (const { value, suffix } of tiers) {
		if (num >= value) {
			const result = num / value;
			const formatted =
				result % 1 === 0 ? result.toFixed(0) : result.toFixed(1);
			return `${formatted}${suffix}`;
		}
	}
	return String(num);
}

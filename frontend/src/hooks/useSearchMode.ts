import { useMemo } from "react";
import type { App } from "bindings/github.com/vinewz/clutch/internal/apps";
import { isMathExpression } from "../lib/math";
import { parseCurrencyInput } from "../lib/currency";

export type SearchMode = "apps" | "math" | "currency";

export interface SearchModeResult {
	mode: SearchMode;
	filteredApps: App[];
	mathExpression: string | null;
	currencyInput: { amount: number; from: string; to: string } | null;
}

export function useSearchMode(
	input: string,
	apps: App[],
): SearchModeResult {
	return useMemo(() => {
		const trimmed = input.trim();

		// Check for currency first (has "to" or "in" keywords)
		const currencyInput = parseCurrencyInput(trimmed);
		if (currencyInput) {
			return {
				mode: "currency",
				filteredApps: [],
				mathExpression: null,
				currencyInput,
			};
		}

		// Check for math expression
		if (isMathExpression(trimmed)) {
			return {
				mode: "math",
				filteredApps: [],
				mathExpression: trimmed,
				currencyInput: null,
			};
		}

		// Default: app search
		const query = trimmed.toLowerCase();
		const filteredApps = apps.filter((app) => {
			const nameMatch = app.name.toLowerCase().includes(query);
			const keywordMatch = app.keywords?.some((k) =>
				k.toLowerCase().includes(query),
			);
			return nameMatch || keywordMatch;
		});

		return {
			mode: "apps",
			filteredApps,
			mathExpression: null,
			currencyInput: null,
		};
	}, [input, apps]);
}
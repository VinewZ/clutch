import { CurrencyService } from "bindings/github.com/vinewz/clutch/internal/currency";

export interface ConversionResult {
	from: string;
	to: string;
	fromName: string;
	toName: string;
	amount: number;
	result: number;
	rate: number;
	timestamp: string;
}

export function parseCurrencyInput(
	input: string,
): { amount: number; from: string; to: string } | null {
	const pattern =
		/(\d+(?:\.\d+)?)\s*([A-Za-z]{1,3})\s*(?:to|into|in|as)\s*([A-Za-z]{1,3})/i;
	const match = input.match(pattern);

	if (!match) return null;

	const amount = parseFloat(match[1]);
	const from = match[2].toUpperCase();
	const to = match[3].toUpperCase();

	if (
		Number.isNaN(amount) ||
		!from ||
		!to ||
		from.length !== 3 ||
		to.length !== 3
	) {
		return null;
	}

	return { amount, from, to };
}

export async function convertCurrency(
	amount: number,
	from: string,
	to: string,
): Promise<ConversionResult> {
	const result = await CurrencyService.Convert(amount, from, to);
	return result;
}

export function formatCurrency(value: number, decimals: number = 2): string {
	return value.toLocaleString(undefined, {
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals,
	});
}

export function formatConversionResult(result: ConversionResult): string {
	return `${result.amount} ${result.from} = ${formatCurrency(result.result)} ${result.to}`;
}

export function formatLastUpdated(timestamp: string): string {
	const date = new Date(timestamp);
	return date.toLocaleString();
}

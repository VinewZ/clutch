export interface MathResult {
	expression: string;
	result: number;
	formatted: string;
}

export function isMathExpression(input: string): boolean {
	// Check if it's a math expression: contains numbers and math operators
	// Must have at least one operator (+, -, *, /, ^)
	const trimmed = input.trim();
	if (!/^[\d\s+\-*/^().]+$/.test(trimmed)) return false;
	if (!/[+\-*/^]/.test(trimmed)) return false;
	// Must be parseable
	try {
		const result = evaluateMath(trimmed);
		return result !== null && !isNaN(result);
	} catch {
		return false;
	}
}

export function evaluateMath(expression: string): number | null {
	try {
		// Replace ^ with ** for exponentiation
		const sanitized = expression.trim().replace(/\^/g, "**");

		// Security: only allow safe characters
		if (!/^[\d\s+\-*/().]+$/.test(sanitized)) {
			return null;
		}

		// Use Function constructor for evaluation (safer than eval)
		const result = new Function(`return ${sanitized}`)();

		if (typeof result !== "number" || !isFinite(result)) {
			return null;
		}

		return result;
	} catch {
		return null;
	}
}

export function formatMathResult(expression: string, result: number): MathResult {
	const formatted =
		Number.isInteger(result)
			? result.toString()
			: result.toLocaleString(undefined, {
					minimumFractionDigits: 0,
					maximumFractionDigits: 10,
				});

	return {
		expression: expression.trim(),
		result,
		formatted: `${expression.trim()} = ${formatted}`,
	};
}
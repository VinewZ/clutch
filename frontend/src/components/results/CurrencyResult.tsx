import { AppController } from "bindings/github.com/vinewz/clutch/internal/apps";
import type { ConversionResult as CurrencyResultType } from "@/lib/currency";
import { formatConversionResult, formatLastUpdated } from "@/lib/currency";

interface CurrencyResultDisplayProps {
	result: CurrencyResultType | null;
	loading: boolean;
	error: string | null;
	onCopy: (text: string) => Promise<boolean>;
}

export function CurrencyResultDisplay({
	result,
	loading,
	error,
	onCopy,
}: CurrencyResultDisplayProps) {
	const handleClick = async () => {
		if (!result) return;
		await onCopy(result.result.toString());
		await AppController.Hide();
	};

	return (
		<div className="p-4 border-b border-border">
			{loading && (
				<div className="p-4 text-center text-muted-foreground">
					Converting...
				</div>
			)}
			{error && <div className="p-4 text-center text-destructive">{error}</div>}
			{result && !loading && (
				<button
					type="button"
					className="flex items-center gap-4 p-4 w-full text-left bg-accent border-l-2 border-primary hover:bg-accent/80"
					onClick={handleClick}
				>
					<div className="text-2xl font-mono">
						{formatConversionResult(result)}
					</div>
					<div className="text-sm text-muted-foreground">
						Press Enter to copy
					</div>
					<div className="text-xs text-muted-foreground">
						Last updated: {formatLastUpdated(result.timestamp)}
					</div>
				</button>
			)}
		</div>
	);
}

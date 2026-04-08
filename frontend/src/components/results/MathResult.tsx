import { AppController } from "bindings/github.com/vinewz/clutch/internal/apps";
import type { MathResult } from "@/lib/math";

interface MathResultDisplayProps {
	result: MathResult;
	onCopy: (text: string) => Promise<boolean>;
}

export function MathResultDisplay({ result, onCopy }: MathResultDisplayProps) {
	const handleClick = async () => {
		await onCopy(result.result.toString());
		await AppController.Hide();
	};

	return (
		<div className="p-4 border-b border-border">
			<button
				type="button"
				className="flex items-center gap-4 p-4 w-full text-left bg-accent border-l-2 border-primary hover:bg-accent/80"
				onClick={handleClick}
			>
				<div className="text-2xl font-mono">{result.formatted}</div>
				<div className="text-sm text-muted-foreground">Press Enter to copy</div>
			</button>
		</div>
	);
}

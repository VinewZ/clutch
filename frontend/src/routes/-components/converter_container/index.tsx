import { useConverter } from "@/hooks/useConverter";
import { cn } from "@/lib/utils";
import { useLocalStorage } from "@uidotdev/usehooks";
import { ArrowRight } from "lucide-react";
import { useEffect, useRef } from "react";

type ConverterContainerProps = {
	input: string;
};

export type MathHistoryT = {
	input: string;
	type: string;
	result: string;
};

export function ConverterContainer({ input }: ConverterContainerProps) {
	const conversion = useConverter(input);
	const [, setMathHistory] = useLocalStorage<MathHistoryT[]>(
		"clutch-math-history",
		[],
	);

	const historyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const lastRecorded = useRef<string | null>(null);

	useEffect(() => {
		if (conversion) {
			const result = conversion.result;

			if (result && result !== lastRecorded.current) {
				if (historyTimer.current) clearTimeout(historyTimer.current);

				historyTimer.current = setTimeout(() => {
					setMathHistory((prev) => [
						{
							input: input,
							type: conversion.type,
							result: conversion.result,
						},
						...prev,
					]);
					lastRecorded.current = result;
				}, 500);
			}
		}

		// cleanup on conversion change or unmount
		return () => {
			if (historyTimer.current) clearTimeout(historyTimer.current);
		};
	}, [conversion, setMathHistory]);

	return (
		<div
			className={cn(
				"overflow-hidden transition-all",
				conversion && conversion.result.length >= 3 ? "h-48" : "h-0",
			)}
		>
			<div className="relative flex h-48 w-full border-b text-center">
				<div className="grid w-1/2 place-content-center border-r p-4 text-4xl">
					<p>{input || "Expression"}</p>
				</div>
				<div className="-translate-1/2 absolute top-1/2 left-1/2 z-10 bg-background py-5">
					<ArrowRight />
				</div>
				<div className="grid w-1/2 place-content-center p-4 text-4xl">
					<p>{conversion?.result || "Result"}</p>
				</div>
			</div>
		</div>
	);
}

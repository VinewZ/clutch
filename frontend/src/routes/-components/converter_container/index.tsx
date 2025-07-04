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
        conversion && conversion.result.length >= 0 ? "h-48" : "h-0"
      )}
    >
      <div className="flex w-full h-48 relative border-b text-center">
        <div className="grid place-content-center w-1/2 text-4xl p-4 border-r">
          <p>{input || "Expression"}</p>
        </div>
        <div className="absolute left-1/2 top-1/2 -translate-1/2 py-5 z-10 bg-background">
          <ArrowRight />
        </div>
        <div className="grid place-content-center w-1/2 text-4xl p-4">
          <p>{conversion?.result || "Result"}</p>
        </div>
      </div>
    </div>
  );
}

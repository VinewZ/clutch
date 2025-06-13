import { cn } from "@/lib/utils"
import { ArrowRight } from "lucide-react"
import { evaluate } from "mathjs"
import { useEffect, useState } from "react"
import * as chrono from 'chrono-node';

type ConversorContainerProps = {
  input: string
}

export function ConversorContainer({ input }: ConversorContainerProps) {
  const [result, setResult] = useState<string>("")

  useEffect(() => {
    let didCompute = false;

    // 1) Try math evaluation
    try {
      const calcR = evaluate(input)
      if (calcR != null && calcR.toString()) {
        setResult(calcR.toString())
        didCompute = true
      }
    } catch (err) {
      // Not a valid math expression, fall through
    }

    // 2) Fallback to date parsing if math failed
    if (!didCompute) {
      const date = chrono.parseDate(input)
      if (date) {
        setResult(date.toLocaleDateString(navigator.language, {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }))
        didCompute = true
      }
    }

    // 3) Optionally clear result if neither parsed
    if (!didCompute) {
      setResult("")
    }
  }, [input])

  return (
    <div
      className={cn(
        "overflow-hidden transition-all h-48",
        result && result.length >= 3 ? "h-48" : "h-0"
      )}
    >
      <div className="flex w-full h-full relative border-b text-center">
        <div className="grid place-content-center w-1/2 text-4xl p-4 border-r">
          <p>{input || "Expression"}</p>
        </div>
        <div className="absolute left-1/2 top-1/2 -translate-1/2 py-5 z-10 bg-background">
          <ArrowRight />
        </div>
        <div className="grid place-content-center w-1/2 text-4xl p-4">
          <p>{result || "Result"}</p>
        </div>
      </div>
    </div>
  )
}

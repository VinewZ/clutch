import { cn } from "@/lib/utils"
import { ArrowRight } from "lucide-react"
import { useConversor } from "@/hooks/useConversor";

type ConversorContainerProps = {
  input: string
}

export function ConversorContainer({ input }: ConversorContainerProps) {
  const result = useConversor(input);

  return (
    <div
      className={cn(
        "overflow-hidden transition-all",
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

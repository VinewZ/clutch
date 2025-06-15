import { evaluate } from "mathjs";
import { useEffect, useRef, useState } from "react";
import * as chrono from "chrono-node";

type useConverterResult = {
  type: string
  result: string
}

export function useConverter(input: string): useConverterResult | null {
  const [result, setResult] = useState<useConverterResult | null>(null)
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    // 1) currency
    parseCurrency(input, controller.signal)
      .then((res) => {
        if (res) {
          const ret: useConverterResult = {
            type: "currency",
            result: res
          }
          setResult(ret)
          return
        }
        // 2) math
        const mathRes = parseMath(input);
        if (mathRes) {
          const ret: useConverterResult = {
            type: "math",
            result: mathRes
          }
          setResult(ret)
          return
        }
        // 3) date
        const dateRes = parseDate(input);
        if (dateRes) {
          const ret: useConverterResult = {
            type: "date",
            result: dateRes
          }
          setResult(ret)
          return
        }
        // clear
        setResult(null);
      })
      .catch((err) => {
        if (err.name !== "AbortError") console.error(err);
      });
  }, [input]);

  return result
}

async function parseCurrency(
  input: string,
  signal: AbortSignal
): Promise<string | null> {
  const match = input.match(/^\s*([\d.]+)\s*([A-Za-z]{3})\s*(?:in|to)\s*([A-Za-z]{3})\s*$/i);
  if (!match) return null;

  const amount = parseFloat(match[1]);
  const from = match[2].toUpperCase();
  const to = match[3].toUpperCase();

  const response = await fetch(
    `https://api.frankfurter.app/latest?amount=${amount}&from=${from}&to=${to}`,
    { signal }
  );
  const data = (await response.json()) as { rates?: Record<string, number> };
  const rate = data.rates?.[to];
  if (rate == null) return null;

  return `${rate.toFixed(2)} ${to}`;
}

function parseMath(input: string): string | null {
  try {
    const value = evaluate(input)
    if (value != null && !Number.isNaN(value as number)) {
      return parseFloat(value.toFixed(2)).toString()
    }
  } catch {
    // ignore
  }
  return null;
}

function parseDate(input: string): string | null {
  const parsed = chrono.parseDate(input);
  if (!parsed) return null;
  return parsed.toLocaleDateString(navigator.language, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}


import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { App } from "bindings/github.com/vinewz/clutch/internal/apps";
import { DesktopApps } from "bindings/github.com/vinewz/clutch/internal/apps";
import { useEffect, useRef, useState } from "react";
import { UnifiedList } from "@/components/list/UnifiedList";
import { CurrencyResultDisplay } from "@/components/results/CurrencyResult";
import { MathResultDisplay } from "@/components/results/MathResult";
import { SearchInput } from "@/components/search/SearchInput";
import { useAppLauncher } from "@/hooks/useAppLauncher";
import { useClipboard } from "@/hooks/useClipboard";
import { useKeyboardNavigation } from "@/hooks/useKeyboardNavigation";
import { useSearchMode } from "@/hooks/useSearchMode";
import {
  getFirstSelectableIndex,
  useUnifiedList,
} from "@/hooks/useUnifiedList";
import {
  type ConversionResult,
  convertCurrency,
  parseCurrencyInput,
} from "@/lib/currency";
import { evaluateMath, formatMathResult, type MathResult } from "@/lib/math";

export const Route = createFileRoute("/")({ component: AppContent });

function AppContent() {
  const { data: apps = [] } = useQuery({
    queryKey: ["apps"],
    queryFn: () => DesktopApps.GetAll(),
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mathResult, setMathResult] = useState<MathResult | null>(null);
  const [currencyResult, setCurrencyResult] = useState<ConversionResult | null>(
    null,
  );
  const [currencyLoading, setCurrencyLoading] = useState(false);
  const [currencyError, setCurrencyError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { mode, filteredApps } = useSearchMode(searchQuery, apps);
  const unifiedList = useUnifiedList(searchQuery, filteredApps);
  const { copy } = useClipboard();
  const { launchApp } = useAppLauncher();
  const navigate = useNavigate();

  // Evaluate math when in math mode
  useEffect(() => {
    if (mode === "math") {
      const result = evaluateMath(searchQuery.trim());
      if (result !== null) {
        setMathResult(formatMathResult(searchQuery.trim(), result));
      } else {
        setMathResult(null);
      }
    } else {
      setMathResult(null);
    }
  }, [mode, searchQuery]);

  // Fetch currency when in currency mode
  useEffect(() => {
    if (mode !== "currency") {
      setCurrencyResult(null);
      setCurrencyError(null);
      return;
    }

    const parsed = parseCurrencyInput(searchQuery.trim());
    if (!parsed) {
      setCurrencyError("Invalid currency format. Use: 10 USD to BRL");
      setCurrencyResult(null);
      return;
    }

    setCurrencyLoading(true);
    setCurrencyError(null);

    convertCurrency(parsed.amount, parsed.from, parsed.to)
      .then(setCurrencyResult)
      .catch((err) => {
        setCurrencyError(err.message || "Conversion failed");
        setCurrencyResult(null);
      })
      .finally(() => setCurrencyLoading(false));
  }, [mode, searchQuery]);

  // Reset selection to first selectable when list changes
  useEffect(() => {
    setSelectedIndex(getFirstSelectableIndex(unifiedList));
  }, [unifiedList]);

  // Scroll selected item into view
  useEffect(() => {
    const element = document.querySelector(`[data-index="${selectedIndex}"]`);
    element?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  // Keyboard navigation
  useKeyboardNavigation({
    mode,
    selectedIndex,
    setSelectedIndex,
    setSearchQuery,
    unifiedList,
    mathResult,
    currencyResult,
    copy,
    launchApp,
    navigate,
    inputRef,
  });

  const showMathResult = mode === "math" && mathResult;
  const showCurrencyResult = mode === "currency";

  const handleAppClick = async (app: App) => {
    await launchApp(app);
    setSearchQuery("");
  };

  const handleRouteClick = (path: string) => {
    navigate({ to: path });
  };

  return (
    <div className="h-screen flex flex-col">
      <SearchInput
        ref={inputRef}
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search apps, math (2+2), currency (10 USD to EUR)..."
      />

      <main className="flex-1 overflow-auto">
        {showMathResult && (
          <MathResultDisplay result={mathResult} onCopy={copy} />
        )}

        {showCurrencyResult && (
          <CurrencyResultDisplay
            result={currencyResult}
            loading={currencyLoading}
            error={currencyError}
            onCopy={copy}
          />
        )}

        {mode === "apps" && (
          <UnifiedList
            list={unifiedList}
            selectedIndex={selectedIndex}
            onAppClick={handleAppClick}
            onRouteClick={handleRouteClick}
          />
        )}
      </main>

      <footer className="border w-full">footer lesgo</footer>
    </div>
  );
}

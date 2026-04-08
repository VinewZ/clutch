import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	AppController,
	DesktopApps,
} from "bindings/github.com/vinewz/clutch/internal/apps";
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { useSearchMode } from "@/hooks/useSearchMode";
import {
  convertCurrency,
  formatConversionResult,
  formatLastUpdated,
  parseCurrencyInput,
  type ConversionResult,
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
	const [currencyResult, setCurrencyResult] =
		useState<ConversionResult | null>(null);
	const [currencyLoading, setCurrencyLoading] = useState(false);
	const [currencyError, setCurrencyError] = useState<string | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const { mode, filteredApps } = useSearchMode(searchQuery, apps);

	// Refs for keyboard handler to avoid dependency issues
	const modeRef = useRef(mode);
	const filteredAppsRef = useRef(filteredApps);
	const selectedIndexRef = useRef(selectedIndex);
	const mathResultRef = useRef(mathResult);
	const currencyResultRef = useRef(currencyResult);

	// Update refs when state changes
	useEffect(() => {
		modeRef.current = mode;
	}, [mode]);

	useEffect(() => {
		filteredAppsRef.current = filteredApps;
	}, [filteredApps]);

	useEffect(() => {
		selectedIndexRef.current = selectedIndex;
	}, [selectedIndex]);

	useEffect(() => {
		mathResultRef.current = mathResult;
	}, [mathResult]);

	useEffect(() => {
		currencyResultRef.current = currencyResult;
	}, [currencyResult]);

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

	// Reset selection when input changes
	useEffect(() => {
		setSelectedIndex(0);
	}, []);

	// Scroll selected item into view
	useEffect(() => {
		const element = document.querySelector(`[data-index="${selectedIndex}"]`);
		element?.scrollIntoView({ block: "nearest" });
	}, [selectedIndex]);

	const copyToClipboard = async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
		} catch {
			// Fallback for older browsers
			const textArea = document.createElement("textarea");
			textArea.value = text;
			textArea.style.position = "fixed";
			textArea.style.left = "-999999px";
			document.body.appendChild(textArea);
			textArea.select();
			document.execCommand("copy");
			document.body.removeChild(textArea);
		}
	};

	const handleKeyDown = async (e: KeyboardEvent) => {
		const currentMode = modeRef.current;
		const currentApps = filteredAppsRef.current;
		const currentSelectedIndex = selectedIndexRef.current;
		const currentMathResult = mathResultRef.current;
		const currentCurrencyResult = currencyResultRef.current;

		switch (e.key) {
			case "Escape":
				setSearchQuery("");
				setSelectedIndex(0);
				inputRef.current?.focus();
				break;
			case "ArrowDown":
				e.preventDefault();
				if (currentMode === "apps") {
					setSelectedIndex((prev) =>
						prev < currentApps.length - 1 ? prev + 1 : 0,
					);
				}
				break;
			case "ArrowUp":
				e.preventDefault();
				if (currentMode === "apps") {
					setSelectedIndex((prev) =>
						prev > 0 ? prev - 1 : currentApps.length - 1,
					);
				}
				break;
			case "Enter":
				e.preventDefault();
				if (
					currentMode === "apps" &&
					currentApps[currentSelectedIndex]
				) {
					await DesktopApps.Launch(currentApps[currentSelectedIndex]);
					AppController.Hide();
				} else if (currentMode === "math" && currentMathResult) {
					await copyToClipboard(currentMathResult.result.toString());
					AppController.Hide();
				} else if (
					currentMode === "currency" &&
					currentCurrencyResult
				) {
					await copyToClipboard(
						currentCurrencyResult.result.toString(),
					);
					AppController.Hide();
				}
				break;
		}
	};

	// eslint-disable-next-line react-hooks/exhaustive-deps
	useEffect(() => {
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);

	const showMathResult = mode === "math" && mathResult;
	const showCurrencyResult = mode === "currency";

	return (
		<div className="h-screen flex flex-col">
      <Link
      to="/clipboard"
      >
      Clipboard
      </Link>
			<div className="sticky top-0 z-10 p-4 border-b border-border bg-background/95 backdrop-blur">
				<Input
					ref={inputRef}
					type="search"
					placeholder="Search apps, math (2+2), currency (10 USD to EUR)..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					className="w-full"
					autoFocus
				/>
			</div>

			<div className="flex-1 overflow-auto">
				{showMathResult && (
					<div className="p-4 border-b border-border">
						<button
							type="button"
							className="flex items-center gap-4 p-4 w-full text-left bg-accent border-l-2 border-primary hover:bg-accent/80"
							onClick={async () => {
								await copyToClipboard(mathResult.result.toString());
								AppController.Hide();
							}}
						>
<div className="text-2xl font-mono">
          {mathResult.formatted}
        </div>
        <div className="text-sm text-muted-foreground">
          Press Enter to copy
        </div>
      </button>
					</div>
				)}

				{showCurrencyResult && (
					<div className="p-4 border-b border-border">
						{currencyLoading && (
							<div className="p-4 text-center text-muted-foreground">
								Converting...
							</div>
						)}
						{currencyError && (
							<div className="p-4 text-center text-destructive">
								{currencyError}
							</div>
						)}
						{currencyResult && !currencyLoading && (
							<button
								type="button"
								className="flex items-center gap-4 p-4 w-full text-left bg-accent border-l-2 border-primary hover:bg-accent/80"
								onClick={async () => {
									await copyToClipboard(
										currencyResult.result.toString(),
									);
									AppController.Hide();
								}}
							>
<div className="text-2xl font-mono">
          {formatConversionResult(currencyResult)}
        </div>
        <div className="text-sm text-muted-foreground">
          Press Enter to copy
        </div>
        <div className="text-xs text-muted-foreground">
          Last updated: {formatLastUpdated(currencyResult.timestamp)}
        </div>
      </button>
						)}
					</div>
				)}

				{mode === "apps" &&
					(filteredApps.length === 0 ? (
						<div className="p-8 text-center text-muted-foreground">
							No apps found
						</div>
					) : (
						<div className="divide-y divide-border">
							{filteredApps.map((app, index) => (
								<button
									type="button"
									key={app.path}
									data-index={index}
									className={`flex items-center gap-4 p-4 w-full text-left transition-colors ${
										index === selectedIndex
											? "bg-accent border-l-2 border-primary"
											: "hover:bg-accent"
									}`}
									onClick={async () => {
										await DesktopApps.Launch(app);
										AppController.Hide();
									}}
								>
									<img
										width={28}
										height={28}
										className="rounded-md object-contain"
										src={`/files/icon?path=${encodeURIComponent(app.iconPath)}`}
										alt={app.name}
										onError={(e) => {
											e.currentTarget.style.display = "none";
										}}
									/>
									<div className="font-medium truncate">
										{app.name}
									</div>
								</button>
							))}
						</div>
					))}
			</div>
		</div>
	);
}

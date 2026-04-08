import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
	type App,
	AppController,
	DesktopApps,
} from "bindings/github.com/vinewz/clutch/internal/apps";
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { useSearchMode } from "@/hooks/useSearchMode";
import {
	type ConversionResult,
	convertCurrency,
	formatConversionResult,
	formatLastUpdated,
	parseCurrencyInput,
} from "@/lib/currency";
import { evaluateMath, formatMathResult, type MathResult } from "@/lib/math";

type ListItem =
	| { index: number; type: "section"; section: "apps" | "routes" }
	| { index: number; type: "app"; app: App }
	| { index: number; type: "route"; path: string; label: string };

const ROUTES: { path: string; label: string }[] = [
	{ path: "/clipboard", label: "Clipboard" },
];

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
	const navigate = useNavigate();

	const getUnifiedList = (): ListItem[] => {
		const query = searchQuery.toLowerCase();
		const filteredAppsList = filteredApps.filter((app) =>
			app.name.toLowerCase().includes(query),
		);
		const filteredRoutes = ROUTES.filter((route) =>
			route.label.toLowerCase().includes(query),
		);

		const list: ListItem[] = [];
		let idx = 0;

		if (filteredAppsList.length > 0) {
			list.push({ index: idx++, type: "section", section: "apps" });
			for (const app of filteredAppsList) {
				list.push({ index: idx++, type: "app", app });
			}
		}

		if (filteredRoutes.length > 0) {
			list.push({ index: idx++, type: "section", section: "routes" });
			for (const route of filteredRoutes) {
				list.push({
					index: idx++,
					type: "route",
					path: route.path,
					label: route.label,
				});
			}
		}

		return list;
	};

	const getFirstSelectableIndex = (list: ListItem[]): number => {
		const firstItem = list.find((item) => item.type !== "section");
		return firstItem?.index ?? 0;
	};

	const unifiedList = getUnifiedList();

	// Refs for keyboard handler to avoid dependency issues
	const modeRef = useRef(mode);
	const filteredAppsRef = useRef(filteredApps);
	const selectedIndexRef = useRef(selectedIndex);
	const mathResultRef = useRef(mathResult);
	const currencyResultRef = useRef(currencyResult);
	const unifiedListRef = useRef<ListItem[]>([]);

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

	useEffect(() => {
		unifiedListRef.current = unifiedList;
	}, [unifiedList]);

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

	// Reset selection to first selectable when input changes
	useEffect(() => {
		setSelectedIndex(getFirstSelectableIndex(unifiedList));
	}, [unifiedList]);

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
		const currentMathResult = mathResultRef.current;
		const currentCurrencyResult = currencyResultRef.current;
		const currentUnifiedList = unifiedListRef.current;
		const currentSelectedIndex = selectedIndexRef.current;

		const getFirstSelectableFromList = (list: ListItem[]): number => {
			const firstItem = list.find((item) => item.type !== "section");
			return firstItem?.index ?? 0;
		};

		switch (e.key) {
			case "Escape":
				setSearchQuery("");
				setSelectedIndex(getFirstSelectableFromList(currentUnifiedList));
				inputRef.current?.focus();
				break;
			case "ArrowDown":
				e.preventDefault();
				if (currentMode === "apps") {
					const nonSectionItems = currentUnifiedList.filter(
						(item) => item.type !== "section",
					);
					if (nonSectionItems.length === 0) return;
					const currentItem = currentUnifiedList[currentSelectedIndex];
					const currentItemIndex = nonSectionItems.findIndex(
						(item) => item.index === currentItem?.index,
					);
					const nextIndex = (currentItemIndex + 1) % nonSectionItems.length;
					const nextItem = nonSectionItems[nextIndex];
					const newSelectedIndex = currentUnifiedList.findIndex(
						(item) => item.index === nextItem.index,
					);
					setSelectedIndex(newSelectedIndex);
				}
				break;
			case "ArrowUp":
				e.preventDefault();
				if (currentMode === "apps") {
					const nonSectionItems = currentUnifiedList.filter(
						(item) => item.type !== "section",
					);
					if (nonSectionItems.length === 0) return;
					const currentItem = currentUnifiedList[currentSelectedIndex];
					const currentItemIndex = nonSectionItems.findIndex(
						(item) => item.index === currentItem?.index,
					);
					const prevIndex =
						(currentItemIndex - 1 + nonSectionItems.length) %
						nonSectionItems.length;
					const prevItem = nonSectionItems[prevIndex];
					const newSelectedIndex = currentUnifiedList.findIndex(
						(item) => item.index === prevItem.index,
					);
					setSelectedIndex(newSelectedIndex);
				}
				break;
			case "Enter":
				e.preventDefault();
				if (currentMode === "math" && currentMathResult) {
					await copyToClipboard(currentMathResult.result.toString());
					AppController.Hide();
				} else if (currentMode === "currency" && currentCurrencyResult) {
					await copyToClipboard(currentCurrencyResult.result.toString());
					AppController.Hide();
				} else if (currentMode === "apps") {
					const currentItem = currentUnifiedList[currentSelectedIndex];
					if (!currentItem || currentItem.type === "section") return;
					if (currentItem.type === "app") {
						await DesktopApps.Launch(currentItem.app);
						AppController.Hide();
					} else if (currentItem.type === "route") {
						navigate({ to: currentItem.path });
					}
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
							<div className="text-2xl font-mono">{mathResult.formatted}</div>
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
									await copyToClipboard(currencyResult.result.toString());
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
					(unifiedList.length === 0 ? (
						<div className="p-8 text-center text-muted-foreground">
							No apps or routes found
						</div>
					) : (
						<div className="divide-y divide-border">
							{unifiedList.map((item) => {
								if (item.type === "section") {
									return (
										<div
											key={`section-${item.section}`}
											className="px-4 py-2 text-sm font-semibold text-muted-foreground uppercase bg-muted/50"
										>
											{item.section}
										</div>
									);
								}
								if (item.type === "app") {
									return (
										<button
											type="button"
											key={item.app.path}
											data-index={item.index}
											className={`flex items-center gap-4 p-4 w-full text-left transition-colors ${
												item.index === selectedIndex
													? "bg-accent border-l-2 border-primary"
													: "hover:bg-accent"
											}`}
											onClick={async () => {
												await DesktopApps.Launch(item.app);
												AppController.Hide();
											}}
										>
											<img
												width={28}
												height={28}
												className="rounded-md object-contain"
												src={`/files/icon?path=${encodeURIComponent(item.app.iconPath)}`}
												alt={item.app.name}
												onError={(e) => {
													e.currentTarget.style.display = "none";
												}}
											/>
											<div className="font-medium truncate">
												{item.app.name}
											</div>
										</button>
									);
								}
								if (item.type === "route") {
									return (
										<button
											type="button"
											key={item.path}
											data-index={item.index}
											className={`flex items-center gap-4 p-4 w-full text-left transition-colors ${
												item.index === selectedIndex
													? "bg-accent border-l-2 border-primary"
													: "hover:bg-accent"
											}`}
											onClick={() => {
												navigate({ to: item.path });
											}}
										>
											<div className="font-medium truncate">{item.label}</div>
										</button>
									);
								}
								return null;
							})}
						</div>
					))}
			</div>
		</div>
	);
}

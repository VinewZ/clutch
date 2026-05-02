import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Circle, Download } from "lucide-react";
import { useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { useListNavigation, useScrollToIndex, useSearchInput } from "@/hooks";
import { formatCount } from "@/lib/utils";
import { useTheme } from "@/providers/theme";
import { useExtensions, useSearchExtensions } from "@/services/store";

export const Route = createFileRoute("/store/")({
	component: StorePage,
});

function StorePage() {
	const navigate = useNavigate();
	const { theme } = useTheme();
	const effectiveTheme =
		theme === "system"
			? window.matchMedia("(prefers-color-scheme: dark)").matches
				? "dark"
				: "light"
			: theme;

	const {
		searchQuery,
		setSearchQuery,
		debouncedQuery,
		inputRef,
		clearInput,
		focusInput,
		isInputEmpty,
	} = useSearchInput({
		onClear: () => setSelectedIndex(0),
	});

	const extensionsQuery = useExtensions();
	const searchResults = useSearchExtensions(debouncedQuery);

	const extensions = useMemo(() => {
		if (debouncedQuery.length > 0 && searchResults.data) {
			return searchResults.data;
		}
		return extensionsQuery.data || [];
	}, [debouncedQuery, searchResults.data, extensionsQuery.data]);

	const handleSelect = useCallback(
		(index: number) => {
			const ext = extensions[index];
			if (!ext) return;
			navigate({ to: "/store/$id", params: { id: ext.id } });
		},
		[extensions, navigate],
	);

	const { selectedIndex, setSelectedIndex } = useListNavigation({
		totalItems: extensions.length,
		isInputEmpty,
		inputRef,
		onSelect: handleSelect,
		onEscape: () => {
			if (!isInputEmpty) {
				clearInput();
				focusInput();
			} else {
				navigate({ to: "/" });
			}
		},
	});

	useScrollToIndex({ selectedIndex });

	if (extensionsQuery.isLoading) {
		return (
			<div className="h-screen flex items-center justify-center">
				Loading extensions...
			</div>
		);
	}

	if (extensionsQuery.isError) {
		return (
			<div className="h-screen flex items-center justify-center text-red-500">
				Error loading extensions
			</div>
		);
	}

	return (
		<div className="flex flex-col h-full overflow-hidden">
			<div className="shrink-0">
				<Input
					ref={inputRef}
					type="search"
					placeholder="Search extensions..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					autoFocus
				/>
			</div>

			<div className="flex-1 overflow-y-auto">
				{extensions.length === 0 ? (
					<div className="p-8 text-center text-muted-foreground">
						No extensions found
					</div>
				) : (
					<div className="divide-y divide-border">
						{extensions.map((ext, index) => (
							<div
								key={ext.id}
								data-index={index}
								className={`flex items-center gap-4 p-4 transition-colors ${
									index === selectedIndex
										? "bg-accent border-l-2 border-primary"
										: "hover:bg-accent"
								}`}
							>
								{(() => {
									const iconSrc =
										ext.icons[effectiveTheme] ||
										ext.icons[effectiveTheme === "dark" ? "light" : "dark"];
									return iconSrc ? (
										<img
											width={28}
											height={28}
											className="rounded-md"
											src={iconSrc}
											alt={ext.title}
										/>
									) : null;
								})()}
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2">
										<p className="font-medium truncate">{ext.title}</p>
										{ext.installed ? (
											<CheckCircle2 className="size-4 shrink-0 text-green-500" />
										) : (
											<Circle className="size-4 shrink-0 text-muted-foreground/40" />
										)}
									</div>
									<p className="text-sm truncate">{ext.description}</p>
								</div>
								<div className="min-w-0 flex gap-2 items-center">
									<Download className="size-5" />
									<span className="text-sm truncate">
										{formatCount(ext.download_count)}
									</span>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

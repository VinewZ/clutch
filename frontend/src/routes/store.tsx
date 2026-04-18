import { useHotkey } from "@tanstack/react-hotkeys";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { useListNavigation, useScrollToIndex, useSearchInput } from "@/hooks";
import {
	useExtensions,
	useInstallExtension,
	useSearchExtensions,
	useUninstallExtension,
} from "@/services/store";

export const Route = createFileRoute("/store")({
	component: StorePage,
});

function StorePage() {
	const navigate = useNavigate();

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
	const installMutation = useInstallExtension();
	const uninstallMutation = useUninstallExtension();

	const extensions = useMemo(() => {
		if (debouncedQuery.length > 0 && searchResults.data) {
			return searchResults.data;
		}
		return extensionsQuery.data || [];
	}, [debouncedQuery, searchResults.data, extensionsQuery.data]);

	const handleSelect = useCallback(
		async (index: number) => {
			const ext = extensions[index];
			if (!ext) return;
			if (ext.installed) {
				await uninstallMutation.mutateAsync(ext.name);
			} else {
				await installMutation.mutateAsync(ext.id);
			}
		},
		[extensions, installMutation, uninstallMutation],
	);

	const { selectedIndex, setSelectedIndex } = useListNavigation({
		totalItems: extensions.length,
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

	useHotkey("Backspace", (e) => {
		if (isInputEmpty && document.activeElement === inputRef.current) {
			e.preventDefault();
			navigate({ to: "/" });
		}
	});

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
		<div className="h-screen flex flex-col">
			<div className="sticky top-0 z-10 p-4 border-b border-border bg-background/95 backdrop-blur">
				<Input
					ref={inputRef}
					type="search"
					placeholder="Search extensions..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					className="w-full"
					autoFocus
				/>
			</div>

			<div className="flex-1 overflow-auto">
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
								{ext.icons.light && (
									<img
										width={32}
										height={32}
										className="rounded-md"
										src={ext.icons.light}
										alt={ext.title}
									/>
								)}
								<div className="flex-1 min-w-0">
									<div className="font-medium truncate">{ext.title}</div>
									<div className="text-sm text-muted-foreground truncate">
										{ext.author.name} · {ext.download_count.toLocaleString()}{" "}
										downloads
									</div>
									<div className="text-xs text-muted-foreground">
										{ext.categories.join(", ")}
									</div>
								</div>
								{ext.installed ? (
									<button
										type="button"
										onClick={() => uninstallMutation.mutate(ext.name)}
										disabled={uninstallMutation.isPending}
										className="px-3 py-1 text-sm border border-border rounded hover:bg-destructive hover:text-destructive-foreground disabled:opacity-50"
									>
										Uninstall
									</button>
								) : (
									<button
										type="button"
										onClick={() => installMutation.mutate(ext.id)}
										disabled={installMutation.isPending}
										className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
									>
										Install
									</button>
								)}
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

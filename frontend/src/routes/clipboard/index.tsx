import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Events } from "@wailsio/runtime";
import { ClipboardService } from "bindings/github.com/vinewz/clutch/internal/clipboard";
import { useEffect, useRef, useState } from "react";
import { Input } from "#/components/ui/input";
import { cn } from "#/lib/utils";
import { Button } from "@/components/ui/button";
import { useClipboardKeyboard } from "@/hooks/keyboard-navigation/use-clipboard-keyboard";
import { formatRelativeTime } from "@/lib/time";

export const Route = createFileRoute("/clipboard/")({
	component: ClipboardPage,
});

function ClipboardPage() {
	const queryClient = useQueryClient();
	const inputRef = useRef<HTMLInputElement>(null);
	const [filter, setFilter] = useState("");
	const [selectedIndex, setSelectedIndex] = useState(0);

	const { data: available, isLoading: availableLoading } = useQuery({
		queryKey: ["clipboard-available"],
		queryFn: () => ClipboardService.IsAvailable(),
	});

	const {
		data: entries = [],
		isLoading: entriesLoading,
		refetch,
	} = useQuery({
		queryKey: ["clipboard-history"],
		queryFn: () => ClipboardService.GetHistory(),
	});

	useEffect(() => {
		const cleanup = Events.On("clipboard:new", () => {
			queryClient.invalidateQueries({ queryKey: ["clipboard-history"] });
		});
		return cleanup;
	}, [queryClient]);

	const filteredEntries = entries.filter((entry) =>
		entry.content.toLowerCase().includes(filter.toLowerCase()),
	);

	// biome-ignore lint: false positive, needed to reset selection to first entry on filter change
	useEffect(() => {
		setSelectedIndex(0);
	}, [filter]);

	useEffect(() => {
		const element = document.querySelector(`[data-index="${selectedIndex}"]`);
		element?.scrollIntoView({ block: "nearest" });
	}, [selectedIndex]);

	useClipboardKeyboard({
		inputRef,
		filter,
		setFilter,
		selectedIndex,
		setSelectedIndex,
		filteredEntries,
	});

	const handleClear = async () => {
		await ClipboardService.ClearHistory();
		refetch();
	};

	if (availableLoading || entriesLoading) {
		return (
			<div className="h-screen flex items-center justify-center">
				<div className="text-center p-8">
					<p className="text-muted-foreground">Loading...</p>
				</div>
			</div>
		);
	}

	if (available === false) {
		return (
			<div className="h-screen flex items-center justify-center">
				<div className="text-center p-8">
					<p className="text-destructive text-lg font-medium">
						wl-clipboard not installed
					</p>
					<p className="text-sm text-muted-foreground mt-2">
						Run: sudo apt install wl-clipboard
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="h-screen flex flex-col">
			<Input
				ref={inputRef}
				type="search"
				placeholder="Filter clipboard entries..."
				value={filter}
				onChange={(e) => setFilter(e.target.value)}
				className="w-full py-6 text-lg"
				autoFocus
			/>
			<div className="sticky top-0 z-10 p-4 border-b border-border bg-background/95 backdrop-blur flex justify-between items-center">
				<h2 className="text-lg font-semibold">Clipboard History</h2>
				<div className="flex items-center gap-2">
					<span className="text-xs text-muted-foreground">
						{entries.length} items
					</span>
					{filteredEntries.length > 0 && (
						<Button
							variant="ghost"
							size="sm"
							onClick={handleClear}
							className="text-sm text-muted-foreground hover:text-destructive"
						>
							Clear All
						</Button>
					)}
				</div>
			</div>

			<div className="flex-1 overflow-auto">
				{filteredEntries.length === 0 ? (
					<div className="p-4 text-muted-foreground">
						{entries.length === 0
							? "No clipboard history. Copy something to get started!"
							: "No entries match your filter."}
					</div>
				) : (
					filteredEntries.map((entry, index) => (
						<div
							key={entry.id}
							data-index={index}
							className={cn(
								"flex border-b border-border relative group ",
								index === selectedIndex && "bg-muted",
							)}
						>
							<div className="w-1/2 p-4 border-r border-border">
								<div className="font-mono text-sm truncate pr-16">
									{entry.content.slice(0, 100)}
									{entry.content.length > 100 && "..."}
								</div>
							</div>

							<div className="w-1/2 p-4">
								<div className="font-mono text-sm whitespace-pre-wrap break-all max-h-32 overflow-auto">
									{entry.content}
								</div>
							</div>

							<div className="absolute bottom-1 right-1 text-xs text-muted-foreground flex gap-2 bg-background/95 px-1">
								<span>
									{formatRelativeTime(entry.timestamp)} • {entry.size} bytes
								</span>
							</div>
						</div>
					))
				)}
			</div>
		</div>
	);
}

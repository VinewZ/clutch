import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Events } from "@wailsio/runtime";
import { ClipboardService } from "bindings/github.com/vinewz/clutch/internal/clipboard";
import { useEffect } from "react";
import { useClipboard } from "@/hooks/useClipboard";
import { formatRelativeTime } from "@/lib/time";

export const Route = createFileRoute("/clipboard")({
	component: ClipboardPage,
});

function ClipboardPage() {
	const queryClient = useQueryClient();
	const { copy } = useClipboard();

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

	const handleCopy = async (content: string) => {
		await copy(content);
	};

	const handleClear = async () => {
		await ClipboardService.ClearHistory();
		refetch();
	};

	const handleDelete = async (id: string) => {
		await ClipboardService.DeleteEntry(id);
		refetch();
	};

	return (
		<div className="h-screen flex flex-col">
			<Link to="/">Home</Link>
			<div className="sticky top-0 z-10 p-4 border-b border-border bg-background/95 backdrop-blur flex justify-between items-center">
				<h2 className="text-lg font-semibold">Clipboard History</h2>
				<div className="flex items-center gap-2">
					<span className="text-xs text-muted-foreground">
						{entries.length} items
					</span>
					{entries.length > 0 && (
						<button
							type="button"
							onClick={handleClear}
							className="text-sm text-muted-foreground hover:text-destructive"
						>
							Clear All
						</button>
					)}
				</div>
			</div>

			<div className="flex-1 overflow-auto">
				{entries.length === 0 ? (
					<div className="p-8 text-center text-muted-foreground">
						No clipboard history. Copy something to get started!
					</div>
				) : (
					entries.map((entry) => (
						<div
							key={entry.id}
							className="flex border-b border-border relative group"
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

							<div className="absolute top-1/2 -translate-y-1/2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
								<button
									type="button"
									onClick={() => handleCopy(entry.content)}
									className="p-1 rounded hover:bg-accent text-xs"
									title="Copy"
								>
									Copy
								</button>
								<button
									type="button"
									onClick={() => handleDelete(entry.id)}
									className="p-1 rounded hover:bg-accent text-xs text-destructive"
									title="Delete"
								>
									Delete
								</button>
							</div>
						</div>
					))
				)}
			</div>
		</div>
	);
}

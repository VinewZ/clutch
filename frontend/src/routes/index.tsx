import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	AppController,
	DesktopApps,
} from "bindings/github.com/vinewz/clutch/internal/apps";
import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/")({ component: AppContent });

function AppContent() {
	const { data: apps = [] } = useQuery({
		queryKey: ["apps"],
		queryFn: () => DesktopApps.GetAll(),
	});
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedIndex, setSelectedIndex] = useState(0);
	const inputRef = useRef<HTMLInputElement>(null);

	const filteredApps = useMemo(() => {
		return apps.filter((app) => {
			const query = searchQuery.toLowerCase();
			const nameMatch = app.name.toLowerCase().includes(query);
			const keywordMatch = app.keywords?.some((k) =>
				k.toLowerCase().includes(query),
			);
			return nameMatch || keywordMatch;
		});
	}, [apps, searchQuery]);

	useEffect(() => {
		const element = document.querySelector(`[data-index="${selectedIndex}"]`);
		element?.scrollIntoView({ block: "nearest" });
	}, [selectedIndex]);

	useEffect(() => {
		const handleKeyDown = async (e: KeyboardEvent) => {
			switch (e.key) {
				case "Escape":
					setSearchQuery("");
					setSelectedIndex(0);
					inputRef.current?.focus();
					break;
				case "ArrowDown":
					e.preventDefault();
					setSelectedIndex((prev) =>
						prev < filteredApps.length - 1 ? prev + 1 : 0,
					);
					break;
				case "ArrowUp":
					e.preventDefault();
					setSelectedIndex((prev) =>
						prev > 0 ? prev - 1 : filteredApps.length - 1,
					);
					break;
				case "Enter":
					e.preventDefault();
					if (filteredApps[selectedIndex]) {
						await DesktopApps.Launch(filteredApps[selectedIndex]);
						AppController.Hide();
					}
					break;
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [selectedIndex, filteredApps]);

	return (
		<div className="h-screen flex flex-col">
			<div className="sticky top-0 z-10 p-4 border-b border-border bg-background/95 backdrop-blur">
				<Input
					ref={inputRef}
					type="search"
					placeholder="Search apps..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					className="w-full"
					autoFocus
				/>
			</div>

			<div className="flex-1 overflow-auto">
				{filteredApps.length === 0 ? (
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
								<div className="font-medium truncate">{app.name}</div>
							</button>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

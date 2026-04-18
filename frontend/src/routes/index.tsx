import { useHotkey } from "@tanstack/react-hotkeys";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
	AppController,
	DesktopApps,
} from "bindings/github.com/vinewz/clutch/internal/apps";
import { useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { useListNavigation, useScrollToIndex, useSearchInput } from "@/hooks";
import { useExtensionCommands } from "@/services/store";

export const Route = createFileRoute("/")({ component: AppContent });

const routes = [{ name: "Raycast Store", path: "/store", icon: "🏪" }];

function AppContent() {
	const navigate = useNavigate();
	const { data: apps = [] } = useQuery({
		queryKey: ["apps"],
		queryFn: () => DesktopApps.GetAll(),
	});
	const extensionCommands = useExtensionCommands();

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

	const filteredItems = useMemo(() => {
		const query = debouncedQuery.toLowerCase();
		return {
			routes: routes.filter((r) => r.name.toLowerCase().includes(query)),
			apps: apps.filter(
				(app) =>
					app.name.toLowerCase().includes(query) ||
					app.keywords?.some((k) => k.toLowerCase().includes(query)),
			),
			extensions: extensionCommands.filter(
				(item) =>
					item.extTitle.toLowerCase().includes(query) ||
					item.command.title.toLowerCase().includes(query) ||
					item.command.description.toLowerCase().includes(query),
			),
		};
	}, [apps, debouncedQuery, extensionCommands]);

	const totalItems =
		filteredItems.routes.length +
		filteredItems.apps.length +
		filteredItems.extensions.length;

	const getItemByIndex = useCallback(
		(index: number) => {
			const routesCount = filteredItems.routes.length;
			const appsCount = filteredItems.apps.length;
			if (index < routesCount) {
				return {
					type: "route" as const,
					...filteredItems.routes[index],
				};
			}
			const appIndex = index - routesCount;
			if (appIndex < appsCount) {
				return {
					type: "app" as const,
					data: filteredItems.apps[appIndex],
				};
			}
			const extIndex = index - routesCount - appsCount;
			if (extIndex < filteredItems.extensions.length) {
				return {
					type: "extension" as const,
					data: filteredItems.extensions[extIndex],
				};
			}
			return null;
		},
		[filteredItems],
	);

	const handleSelect = useCallback(
		async (index: number) => {
			const item = getItemByIndex(index);
			if (item?.type === "route") {
				navigate({ to: item.path });
			} else if (item?.type === "app") {
				await DesktopApps.Launch(item.data);
				AppController.Hide();
			} else if (item?.type === "extension") {
				navigate({
					to: "/extension/$name/$command",
					params: { name: item.data.extName, command: item.data.command.name },
				});
			}
		},
		[getItemByIndex, navigate],
	);

	const { selectedIndex, setSelectedIndex } = useListNavigation({
		totalItems,
		onSelect: handleSelect,
		onEscape: () => {
			if (!isInputEmpty) {
				clearInput();
				focusInput();
			}
		},
	});

	useScrollToIndex({ selectedIndex });

	useHotkey("Backspace", (e) => {
		if (isInputEmpty && document.activeElement === inputRef.current) {
			e.preventDefault();
		}
	});

	return (
		<div className="h-screen flex flex-col">
			<div className="sticky top-0 z-10 p-4 border-b border-border bg-background/95 backdrop-blur">
				<Input
					ref={inputRef}
					type="search"
					placeholder="Search..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					className="w-full"
					autoFocus
				/>
			</div>

			<div className="flex-1 overflow-auto">
				{filteredItems.routes.length === 0 &&
				filteredItems.apps.length === 0 &&
				filteredItems.extensions.length === 0 ? (
					<div className="p-8 text-center text-muted-foreground">
						No results found
					</div>
				) : (
					<>
						{filteredItems.routes.length > 0 && (
							<>
								<div className="px-4 py-2 text-xs font-semibold text-muted-foreground bg-muted/50">
									ROUTES
								</div>
								{filteredItems.routes.map((route, idx) => (
									<button
										type="button"
										key={route.path}
										data-index={idx}
										className={`flex items-center gap-4 p-4 w-full text-left transition-colors ${
											idx === selectedIndex
												? "bg-accent border-l-2 border-primary"
												: "hover:bg-accent"
										}`}
										onClick={() => navigate({ to: route.path })}
									>
										<span className="text-2xl">{route.icon}</span>
										<span className="font-medium truncate">{route.name}</span>
									</button>
								))}
							</>
						)}

						{filteredItems.apps.length > 0 && (
							<>
								<div className="px-4 py-2 text-xs font-semibold text-muted-foreground bg-muted/50">
									APPS
								</div>
								{filteredItems.apps.map((app, idx) => {
									const globalIdx = filteredItems.routes.length + idx;
									return (
										<button
											type="button"
											key={app.path}
											data-index={globalIdx}
											className={`flex items-center gap-4 p-4 w-full text-left transition-colors ${
												globalIdx === selectedIndex
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
											<span className="font-medium truncate">{app.name}</span>
										</button>
									);
								})}
							</>
						)}

						{filteredItems.extensions.length > 0 && (
							<>
								<div className="px-4 py-2 text-xs font-semibold text-muted-foreground bg-muted/50">
									EXTENSIONS
								</div>
								{filteredItems.extensions.map((item, idx) => {
									const globalIdx =
										filteredItems.routes.length +
										filteredItems.apps.length +
										idx;
									const iconUrl = item.extIcons.dark || item.extIcons.light;
									return (
										<button
											type="button"
											key={`${item.extName}-${item.command.name}`}
											data-index={globalIdx}
											className={`flex items-center gap-4 p-4 w-full text-left transition-colors ${
												globalIdx === selectedIndex
													? "bg-accent border-l-2 border-primary"
													: "hover:bg-accent"
											}`}
											onClick={() => {
												navigate({
													to: "/extension/$name/$command",
													params: {
														name: item.extName,
														command: item.command.name,
													},
												});
											}}
										>
											{iconUrl ? (
												<img
													width={28}
													height={28}
													className="rounded-md object-contain"
													src={iconUrl}
													alt={item.extTitle}
													onError={(e) => {
														e.currentTarget.style.display = "none";
													}}
												/>
											) : (
												<span className="text-2xl">📦</span>
											)}
											<div className="flex flex-col min-w-0">
												<span className="font-medium truncate">
													{item.extTitle} → {item.command.title}
												</span>
												{item.command.description && (
													<span className="text-xs text-muted-foreground truncate">
														{item.command.description}
													</span>
												)}
											</div>
										</button>
									);
								})}
							</>
						)}
					</>
				)}
			</div>
		</div>
	);
}

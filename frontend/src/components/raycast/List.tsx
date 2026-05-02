import { Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	type JsonNodeData,
	renderJsonChildren,
	renderJsonNode,
	type TextJsonNodeData,
} from "@/components/JsonNode";
import { resolveIcon } from "@/lib/resolve-icon";
import { cn } from "@/lib/utils";
import type { RaycastComponentProps } from "./types";

interface ListChildNode {
	type: string;
	props: Record<string, unknown>;
	children: unknown[];
	id: string;
}

interface TextProp {
	text: string;
	tooltip?: string;
}

function resolveTextProp(value: unknown): TextProp {
	if (typeof value === "string") return { text: value };
	if (typeof value === "object" && value !== null && "value" in value) {
		const obj = value as { value: string; tooltip?: string };
		return { text: obj.value, tooltip: obj.tooltip };
	}
	return { text: "" };
}

function findItems(children: ListChildNode[]): ListChildNode[] {
	const items: ListChildNode[] = [];
	for (const child of children) {
		if (child.type === "List.Item") {
			items.push(child);
		} else if (child.type === "List.Section" && Array.isArray(child.children)) {
			items.push(...findItems(child.children as ListChildNode[]));
		}
	}
	return items;
}

function findActions(node: ListChildNode): ListChildNode | null {
	for (const child of node.children as ListChildNode[]) {
		if (child.type === "Slot" && child.props.name === "actions") {
			return (child.children as ListChildNode[])[0] ?? null;
		}
	}
	return null;
}

function findDetail(node: ListChildNode): ListChildNode | null {
	for (const child of node.children as ListChildNode[]) {
		if (child.type === "Slot" && child.props.name === "detail") {
			return (child.children as ListChildNode[])[0] ?? null;
		}
	}
	return null;
}

function collectActions(panel: ListChildNode): ListChildNode[] {
	const actions: ListChildNode[] = [];
	for (const child of panel.children as ListChildNode[]) {
		if (child.type === "ActionPanel.Section") {
			for (const sc of child.children as ListChildNode[]) {
				if (
					sc.type.startsWith("Action") &&
					sc.type !== "ActionPanel" &&
					sc.type !== "ActionPanel.Section"
				) {
					actions.push(sc);
				}
			}
		} else if (
			child.type.startsWith("Action") &&
			child.type !== "ActionPanel" &&
			child.type !== "ActionPanel.Section"
		) {
			actions.push(child);
		}
	}
	return actions;
}

function isRenderableComponent(value: unknown): value is React.ComponentType<{
	size?: number;
	className?: string;
	style?: React.CSSProperties;
}> {
	if (typeof value === "function") return true;
	if (typeof value === "object" && value !== null) {
		const obj = value as Record<string, unknown>;
		return typeof obj.$$typeof === "symbol" || typeof obj.render === "function";
	}
	return false;
}

export function renderIcon(icon: unknown): React.ReactNode {
	if (!icon) return null;
	if (typeof icon === "string") {
		const resolved = resolveIcon(icon);
		if (isRenderableComponent(resolved)) {
			const I = resolved;
			return <I size={18} className="text-muted-foreground shrink-0" />;
		}
		return null;
	}
	if (isRenderableComponent(icon)) {
		const I = icon;
		return <I size={18} className="text-muted-foreground shrink-0" />;
	}
	if (typeof icon === "object" && icon !== null && "source" in icon) {
		const obj = icon as { source: unknown; tintColor?: string };
		if (isRenderableComponent(obj.source)) {
			const I = obj.source;
			return (
				<I
					size={18}
					className="text-muted-foreground shrink-0"
					style={obj.tintColor ? { color: obj.tintColor } : undefined}
				/>
			);
		}
	}
	return null;
}

export function List({ node, onEvent }: RaycastComponentProps) {
	const searchBarPlaceholder =
		(node.props.searchBarPlaceholder as string) ?? "Search...";
	const isLoading = node.props.isLoading as boolean | undefined;
	const isShowingDetail = node.props.isShowingDetail as boolean | undefined;
	const onSearchTextChange = node.props.onSearchTextChange as
		| { $handler: string }
		| undefined;

	const searchTextFromProps = node.props.searchText as string | undefined;
	const [searchText, setSearchText] = useState(searchTextFromProps ?? "");
	const [selectedIndex, setSelectedIndex] = useState(0);
	const listRef = useRef<HTMLDivElement>(null);

	// biome-ignore lint/correctness/useExhaustiveDependencies: only sync from extension, not local state
	useEffect(() => {
		if (
			searchTextFromProps !== undefined &&
			searchTextFromProps !== searchText
		) {
			setSearchText(searchTextFromProps);
		}
	}, [searchTextFromProps]);

	const listChildren = node.children as ListChildNode[];
	const searchBarAccessorySlot = listChildren.find(
		(child) =>
			child.type === "Slot" && child.props.name === "searchBarAccessory",
	);
	const searchBarAccessoryNodes = searchBarAccessorySlot
		? (searchBarAccessorySlot.children as ListChildNode[])
		: [];
	const filteredChildren = searchBarAccessorySlot
		? listChildren.filter((child) => child.id !== searchBarAccessorySlot.id)
		: listChildren;

	const items = findItems(listChildren);
	const selectedItem = items[selectedIndex] ?? null;
	const selectedActions = selectedItem ? findActions(selectedItem) : null;
	const selectedDetail = selectedItem ? findDetail(selectedItem) : null;

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "ArrowDown") {
				e.preventDefault();
				setSelectedIndex((i) => Math.min(i + 1, items.length - 1));
			} else if (e.key === "ArrowUp") {
				e.preventDefault();
				setSelectedIndex((i) => Math.max(i - 1, 0));
			} else if (e.key === "Enter" && selectedItem) {
				const handler = selectedItem.props.onAction as
					| { $handler: string }
					| undefined;
				if (handler?.$handler) onEvent?.(handler.$handler, {});
			}
		},
		[items, selectedItem, onEvent],
	);

	// biome-ignore lint/correctness/useExhaustiveDependencies: reset on item count change
	useEffect(() => {
		setSelectedIndex(0);
	}, [items.length]);

	useEffect(() => {
		if (selectedIndex >= items.length) {
			setSelectedIndex(Math.max(0, items.length - 1));
		}
	}, [items.length, selectedIndex]);

	const handleSearchChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const value = e.target.value;
			console.log(
				"[List:handleSearchChange] value:",
				value,
				"has $handler:",
				!!onSearchTextChange?.$handler,
				"handlerId:",
				onSearchTextChange?.$handler,
				"onEvent defined:",
				!!onEvent,
			);
			setSearchText(value);
			if (onSearchTextChange?.$handler) {
				onEvent?.(onSearchTextChange.$handler, { searchText: value });
			} else {
				console.warn(
					"[List:handleSearchChange] no $handler for onSearchTextChange — event will NOT be sent to backend",
				);
			}
		},
		[onSearchTextChange, onEvent],
	);

	const renderItemContent = (item: ListChildNode) => {
		const icon = item.props.icon;
		const titleProp = resolveTextProp(item.props.title);
		const subtitleProp = resolveTextProp(item.props.subtitle);
		const accessories = item.props.accessories as
			| Array<Record<string, unknown>>
			| undefined;

		return (
			<>
				{icon && (
					<span className="shrink-0 text-muted-foreground">
						{renderIcon(icon)}
					</span>
				)}
				<div className="flex-1 min-w-0">
					<div
						className="text-sm font-medium truncate"
						title={titleProp.tooltip}
					>
						{titleProp.text}
					</div>
					{subtitleProp.text && (
						<div
							className="text-xs text-muted-foreground truncate"
							title={subtitleProp.tooltip}
						>
							{subtitleProp.text}
						</div>
					)}
				</div>
				{accessories && accessories.length > 0 && (
					<div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
						{accessories.map((acc, i) => {
							const key = `acc-${i}-${String(acc.text ?? acc.tag ?? "")}`;
							if (acc.text) return <span key={key}>{String(acc.text)}</span>;
							if (acc.tag) {
								return (
									<span
										key={key}
										className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium bg-muted"
									>
										{String(acc.tag)}
									</span>
								);
							}
							return null;
						})}
					</div>
				)}
			</>
		);
	};

	const renderChildren = (children: ListChildNode[]) => {
		return children.map((child) => {
			if (child.type === "List.Item") {
				const idx = items.indexOf(child);
				const isSelected = idx === selectedIndex;
				return (
					<div
						key={child.id}
						role="option"
						tabIndex={0}
						aria-selected={isSelected}
						data-node-type={child.type}
						data-node-id={child.id}
						className={cn(
							"flex items-center gap-3 px-4 py-2.5 cursor-default transition-colors",
							isSelected && "bg-accent border-l-2 border-primary",
						)}
						onClick={() => setSelectedIndex(idx)}
						onKeyDown={(e) => {
							if (e.key === "Enter" || e.key === " ") {
								e.preventDefault();
								setSelectedIndex(idx);
							}
						}}
					>
						{renderItemContent(child)}
					</div>
				);
			}
			if (child.type === "List.Section") {
				return (
					<div key={child.id}>
						{child.props.title ? (
							<div className="px-4 py-2 text-xs font-semibold text-muted-foreground bg-muted/50 border-b border-border">
								{String(child.props.title)}
							</div>
						) : null}
						{renderChildren(child.children as ListChildNode[])}
					</div>
				);
			}
			if (child.type === "List.EmptyView") {
				if (items.length > 0) return null;
				if (isLoading && !searchText) return null;
				return (
					<div key={child.id}>
						{renderJsonNode(child as unknown as JsonNodeData, onEvent)}
					</div>
				);
			}
			if (child.type === "Slot") {
				return (
					<div key={child.id} data-slot={child.props.name as string}>
						{renderJsonChildren(
							child.children as (JsonNodeData | TextJsonNodeData)[],
							onEvent,
						)}
					</div>
				);
			}
			if (child.type === "TEXT") {
				return (
					<div key={child.id} className="px-4 py-2 text-sm">
						{(child as unknown as TextJsonNodeData).props.text}
					</div>
				);
			}
			return (
				<div key={child.id}>
					{renderJsonChildren(
						child.children as (JsonNodeData | TextJsonNodeData)[],
						onEvent,
					)}
				</div>
			);
		});
	};

	const actionItems = selectedActions ? collectActions(selectedActions) : [];

	return (
		<div
			ref={listRef}
			role="listbox"
			className="h-full flex flex-col bg-background"
			onKeyDown={handleKeyDown}
		>
			<div className="sticky top-0 z-10 flex items-center gap-2 px-4 py-3 border-b border-border bg-background/95 backdrop-blur">
				<Search className="size-4 text-muted-foreground shrink-0" />
				<input
					type="text"
					value={searchText}
					onChange={handleSearchChange}
					placeholder={searchBarPlaceholder}
					className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
				/>
				{searchBarAccessoryNodes.map((acc) =>
					renderJsonNode(acc as unknown as JsonNodeData, onEvent),
				)}
			</div>
			{isLoading && (
				<div className="h-0.5 w-full bg-muted overflow-hidden">
					<div className="h-full w-1/3 bg-primary animate-[loading-bar_1.5s_ease-in-out_infinite]" />
				</div>
			)}

			<div className="flex-1 flex min-h-0">
				<div className="flex-1 overflow-y-auto">
					{renderChildren(filteredChildren)}
				</div>

				{isShowingDetail && selectedItem && (
					<div className="w-1/2 border-l border-border overflow-y-auto">
						{selectedDetail
							? renderJsonNode(
									selectedDetail as unknown as JsonNodeData,
									onEvent,
								)
							: null}
					</div>
				)}
			</div>

			{actionItems.length > 0 && (
				<div className="border-t border-border px-4 py-2">
					<div className="flex items-center gap-3 flex-wrap">
						{actionItems.map((action) => {
							const title = action.props.title as string | undefined;
							const shortcut = action.props.shortcut as
								| { modifiers?: string[]; key?: string }
								| undefined;
							const onAction = action.props.onAction as
								| { $handler: string }
								| undefined;
							const style = action.props.style as string | undefined;

							return (
								<button
									key={action.id}
									type="button"
									onClick={() => {
										if (onAction?.$handler) onEvent?.(onAction.$handler, {});
									}}
									className={cn(
										"text-xs px-2 py-1 rounded border border-border transition-colors",
										style === "destructive"
											? "hover:bg-destructive hover:text-destructive-foreground"
											: "hover:bg-accent",
									)}
								>
									{title ?? action.type.replace("Action.", "")}
									{shortcut && (
										<kbd className="ml-1.5 text-[10px] text-muted-foreground">
											{shortcut.modifiers?.join("+")}
											{shortcut.modifiers?.length ? "+" : ""}
											{shortcut.key}
										</kbd>
									)}
								</button>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
}

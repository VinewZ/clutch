const RAYCAST_PROPS = new Set([
	"searchBarPlaceholder",
	"searchBarTooltip",
	"throttle",
	"isShowingDetail",
	"isLoading",
	"selectedItemIndex",
	"navigationTitle",
	"navigationText",
	"searchText",
	"onSearchTextChange",
	"onSelectionChange",
	"onHover",
	"actions",
	"detail",
	"icon",
	"tintColor",
	"accessories",
	"accessoryTitle",
	"accessoryIcon",
	"tooltip",
	"shortcut",
	"style",
	"onAction",
	"onSubmit",
	"onChange",
	"onFocus",
	"onBlur",
	"onValidate",
	"title",
	"subtitle",
	"label",
	"placeholder",
	"value",
	"defaultValue",
	"id",
	"store",
	"info",
	"errors",
	"date",
	"type",
	"min",
	"max",
	"step",
	"filter",
	"allowCreation",
	"createTitle",
	"canCreateTag",
	"titleLine",
	"matching",
	"showingPreview",
	"enableComments",
	"content",
	"markdown",
	"source",
	"formItemId",
	"name",
]);

export function filterHtmlProps(
	props: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
	if (!props) return {};
	const result: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(props)) {
		if (key.startsWith("data-") || key.startsWith("aria-")) {
			result[key] = value;
			continue;
		}
		if (RAYCAST_PROPS.has(key)) continue;
		if (typeof value === "function") continue;
		if (typeof value === "object" && value !== null && !Array.isArray(value)) {
			if ("$handler" in (value as object)) continue;
		}
		result[key] = value;
	}
	return result;
}

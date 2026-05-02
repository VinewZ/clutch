import type { ComponentType } from "react";
import {
	type JsonNodeData,
	renderJsonChildren,
	type TextJsonNodeData,
} from "@/components/JsonNode";
import { Action } from "./Action";
import { ActionPanel } from "./ActionPanel";
import { Detail } from "./Detail";
import { Form } from "./Form";
import { FormCheckbox } from "./FormCheckbox";
import { FormDropdown } from "./FormDropdown";
import { FormSeparator } from "./FormSeparator";
import { FormTextArea } from "./FormTextArea";
import { FormTextField } from "./FormTextField";
import { List } from "./List";
import {
	ListDropdown,
	ListDropdownItem,
	ListDropdownSection,
} from "./ListDropdown";
import { ListEmptyView } from "./ListEmptyView";
import { ListItem } from "./ListItem";
import { ListItemDetail } from "./ListItemDetail";
import { ListItemDetailMetadata } from "./ListItemDetailMetadata";
import {
	MetadataLabel,
	MetadataLink,
	MetadataSeparator,
	MetadataTagList,
} from "./ListItemDetailMetadataSub";
import { ListSection } from "./ListSection";
import { NavigationContainer } from "./NavigationContainer";
import { Slot } from "./Slot";
import type { RaycastComponentProps } from "./types";

const registry = new Map<string, ComponentType<RaycastComponentProps>>();

registry.set("NavigationContainer", NavigationContainer);
registry.set(
	"FragmentContainer",
	({ node, onEvent }: RaycastComponentProps) => (
		<>
			{renderJsonChildren(
				node.children as (JsonNodeData | TextJsonNodeData)[],
				onEvent,
			)}
		</>
	),
);
registry.set("List", List);
registry.set("List.Item", ListItem);
registry.set("List.Item.Detail", ListItemDetail);
registry.set("List.Item.Detail.Metadata", ListItemDetailMetadata);
registry.set("List.Item.Detail.Metadata.Label", MetadataLabel);
registry.set("List.Item.Detail.Metadata.Link", MetadataLink);
registry.set("List.Item.Detail.Metadata.TagList", MetadataTagList);
registry.set("List.Item.Detail.Metadata.TagList.Item", MetadataTagList);
registry.set("List.Item.Detail.Metadata.Separator", MetadataSeparator);
registry.set("List.Section", ListSection);
registry.set("List.EmptyView", ListEmptyView);
registry.set("List.Dropdown", ListDropdown);
registry.set("List.Dropdown.Item", ListDropdownItem);
registry.set("List.Dropdown.Section", ListDropdownSection);
registry.set("Detail", Detail);
registry.set("Form", Form);
registry.set("Form.TextField", FormTextField);
registry.set("Form.TextArea", FormTextArea);
registry.set("Form.Dropdown", FormDropdown);
registry.set("Form.Checkbox", FormCheckbox);
registry.set("Form.Separator", FormSeparator);
registry.set("ActionPanel", ActionPanel);
registry.set("Action", Action);
registry.set("Action.CopyToClipboard", Action);
registry.set("Action.Open", Action);
registry.set("Action.OpenInBrowser", Action);
registry.set("Action.OpenWith", Action);
registry.set("Action.Paste", Action);
registry.set("Action.Push", Action);
registry.set("Action.ShowInFinder", Action);
registry.set("Action.SubmitForm", Action);
registry.set("Action.Trash", Action);
registry.set("Action.CreateSnippet", Action);
registry.set("Action.CreateQuicklink", Action);
registry.set("Action.ToggleQuickLook", Action);
registry.set("Action.PickDate", Action);
registry.set("ActionPanel.Section", ActionPanel);
registry.set("ActionPanel.Submenu", ActionPanel);
registry.set("Slot", Slot);

export function lookupComponent(
	type: string,
): ComponentType<RaycastComponentProps> | null {
	return registry.get(type) ?? null;
}

export type { RaycastComponentProps };

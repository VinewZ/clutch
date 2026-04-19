import { createComponent, createSlottedComponent } from "../factories";

const List = createSlottedComponent("List", ["searchBarAccessory"] as const);
const Item = createSlottedComponent("List.Item", [
	"detail",
	"actions",
] as const);
const Section = createComponent("List.Section");
const EmptyView = createComponent("List.EmptyView");
const Dropdown = createComponent("List.Dropdown");
const DropdownItem = createComponent("List.Dropdown.Item");
const DropdownSection = createComponent("List.Dropdown.Section");
const ItemDetail = createSlottedComponent("List.Item.Detail", [
	"metadata",
] as const);
const ItemDetailMetadata = createComponent("List.Item.Detail.Metadata");
const ItemDetailMetadataLabel = createComponent(
	"List.Item.Detail.Metadata.Label",
);
const ItemDetailMetadataLink = createComponent(
	"List.Item.Detail.Metadata.Link",
);
const ItemDetailMetadataTagList = createComponent(
	"List.Item.Detail.Metadata.TagList",
);
const ItemDetailMetadataTagListItem = createComponent(
	"List.Item.Detail.Metadata.TagList.Item",
);
const ItemDetailMetadataSeparator = createComponent(
	"List.Item.Detail.Metadata.Separator",
);

List.Item = Item;
List.Section = Section;
List.Dropdown = Dropdown;
List.EmptyView = EmptyView;

Dropdown.Item = DropdownItem;
Dropdown.Section = DropdownSection;

Item.Detail = ItemDetail;

ItemDetail.Metadata = ItemDetailMetadata;

ItemDetailMetadata.Label = ItemDetailMetadataLabel;
ItemDetailMetadata.Link = ItemDetailMetadataLink;
ItemDetailMetadata.TagList = ItemDetailMetadataTagList;
ItemDetailMetadata.Separator = ItemDetailMetadataSeparator;

ItemDetailMetadataTagList.Item = ItemDetailMetadataTagListItem;

export { List };

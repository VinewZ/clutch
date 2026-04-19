import { createComponent, createSlottedComponent } from "../factories";

const Detail = createSlottedComponent("Detail", ["metadata"] as const);
const Metadata = createComponent("Detail.Metadata");
const MetadataLabel = createComponent("Detail.Metadata.Label");
const MetadataLink = createComponent("Detail.Metadata.Link");
const MetadataTagList = createComponent("Detail.Metadata.TagList");
const MetadataTagListItem = createComponent("Detail.Metadata.TagList.Item");
const MetadataSeparator = createComponent("Detail.Metadata.Separator");

Detail.Metadata = Metadata;

Metadata.Label = MetadataLabel;
Metadata.Link = MetadataLink;
Metadata.TagList = MetadataTagList;
Metadata.Separator = MetadataSeparator;

MetadataTagList.Item = MetadataTagListItem;

export { Detail };

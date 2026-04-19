import { createComponent, createSlottedComponent } from "../factories";

const Grid = createSlottedComponent("Grid", ["searchBarAccessory"] as const);
const Item = createSlottedComponent("Grid.Item", ["actions"] as const);
const Section = createComponent("Grid.Section");
const EmptyView = createComponent("Grid.EmptyView");
const Dropdown = createComponent("Grid.Dropdown");
const DropdownItem = createComponent("Grid.Dropdown.Item");
const DropdownSection = createComponent("Grid.Dropdown.Section");

Grid.Item = Item;
Grid.Section = Section;
Grid.Dropdown = Dropdown;
Grid.EmptyView = EmptyView;

Dropdown.Item = DropdownItem;
Dropdown.Section = DropdownSection;

export { Grid };

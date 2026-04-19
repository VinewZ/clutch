import { createComponent, createSlottedComponent } from "../factories";

const Form = createSlottedComponent("Form", ["searchBarAccessory"] as const);
const TextField = createComponent("Form.TextField");
const PasswordField = createComponent("Form.PasswordField");
const TextArea = createComponent("Form.TextArea");
const Checkbox = createComponent("Form.Checkbox");
const DatePicker = createComponent("Form.DatePicker");
const TagPicker = createComponent("Form.TagPicker");
const Dropdown = createComponent("Form.Dropdown");
const DropdownItem = createComponent("Form.Dropdown.Item");
const DropdownSection = createComponent("Form.Dropdown.Section");
const FilePicker = createComponent("Form.FilePicker");
const Separator = createComponent("Form.Separator");
const LinkAccessory = createComponent("Form.LinkAccessory");

Form.TextField = TextField;
Form.PasswordField = PasswordField;
Form.TextArea = TextArea;
Form.Checkbox = Checkbox;
Form.DatePicker = DatePicker;
Form.TagPicker = TagPicker;
Form.Dropdown = Dropdown;
Form.FilePicker = FilePicker;
Form.Separator = Separator;
Form.LinkAccessory = LinkAccessory;

Dropdown.Item = DropdownItem;
Dropdown.Section = DropdownSection;

export { Form };

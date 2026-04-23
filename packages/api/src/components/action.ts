import { createComponent, createBuiltinActionComponent } from "../factories";

const Action = createComponent("Action");
const CopyToClipboard = createBuiltinActionComponent("Action.CopyToClipboard");
const Open = createBuiltinActionComponent("Action.Open");
const OpenInBrowser = createBuiltinActionComponent("Action.OpenInBrowser");
const OpenWith = createBuiltinActionComponent("Action.OpenWith");
const Paste = createBuiltinActionComponent("Action.Paste");
const Push = createBuiltinActionComponent("Action.Push");
const ShowInFinder = createBuiltinActionComponent("Action.ShowInFinder");
const SubmitForm = createComponent("Action.SubmitForm");
const Trash = createBuiltinActionComponent("Action.Trash");
const CreateSnippet = createBuiltinActionComponent("Action.CreateSnippet");
const CreateQuicklink = createBuiltinActionComponent("Action.CreateQuicklink");
const ToggleQuickLook = createBuiltinActionComponent("Action.ToggleQuickLook");
const PickDate = createBuiltinActionComponent("Action.PickDate");

Action.CopyToClipboard = CopyToClipboard;
Action.Open = Open;
Action.OpenInBrowser = OpenInBrowser;
Action.OpenWith = OpenWith;
Action.Paste = Paste;
Action.Push = Push;
Action.ShowInFinder = ShowInFinder;
Action.SubmitForm = SubmitForm;
Action.Trash = Trash;
Action.CreateSnippet = CreateSnippet;
Action.CreateQuicklink = CreateQuicklink;
Action.ToggleQuickLook = ToggleQuickLook;
Action.PickDate = PickDate;

Action.Style = {
	Regular: "regular",
	Destructive: "destructive",
} as const;

PickDate.Type = {
	Date: "date",
	DateTime: "datetime",
} as const;

PickDate.isFullDay = (date: Date): boolean => {
	return (
		date.getHours() === 0 &&
		date.getMinutes() === 0 &&
		date.getSeconds() === 0 &&
		date.getMilliseconds() === 0
	);
};

const ActionPanel = createComponent("ActionPanel");
const ActionPanelSection = createComponent("ActionPanel.Section");
const ActionPanelSubmenu = createComponent("ActionPanel.Submenu");

ActionPanel.Section = ActionPanelSection;
ActionPanel.Submenu = ActionPanelSubmenu;

export { Action, ActionPanel };

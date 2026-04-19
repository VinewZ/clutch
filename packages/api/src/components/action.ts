import { createComponent } from "../factories";

const Action = createComponent("Action");
const CopyToClipboard = createComponent("Action.CopyToClipboard");
const Open = createComponent("Action.Open");
const OpenInBrowser = createComponent("Action.OpenInBrowser");
const OpenWith = createComponent("Action.OpenWith");
const Paste = createComponent("Action.Paste");
const Push = createComponent("Action.Push");
const ShowInFinder = createComponent("Action.ShowInFinder");
const SubmitForm = createComponent("Action.SubmitForm");
const Trash = createComponent("Action.Trash");
const CreateSnippet = createComponent("Action.CreateSnippet");
const CreateQuicklink = createComponent("Action.CreateQuicklink");
const ToggleQuickLook = createComponent("Action.ToggleQuickLook");
const PickDate = createComponent("Action.PickDate");

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

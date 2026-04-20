import { jsx } from "react/jsx-runtime";
import { createContext, createElement, useCallback, useContext, useEffect, useRef, useState } from "react";
//#region src/cache.ts
var Cache = class {
	store = /* @__PURE__ */ new Map();
	subscribers = /* @__PURE__ */ new Set();
	namespace;
	capacity;
	currentSize = 0;
	constructor(options) {
		this.capacity = options?.capacity ?? 10 * 1024 * 1024;
		this.namespace = options?.namespace;
	}
	getKey(key) {
		return this.namespace ? `${this.namespace}:${key}` : key;
	}
	notifySubscribers(key, data) {
		for (const subscriber of this.subscribers) try {
			subscriber(key, data);
		} catch {}
	}
	evictLRU(neededSize) {
		if (this.currentSize + neededSize <= this.capacity) return;
		const entries = Array.from(this.store.entries());
		entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
		for (const [key, entry] of entries) {
			if (this.currentSize + neededSize <= this.capacity) break;
			this.store.delete(key);
			this.currentSize -= entry.size;
		}
	}
	get(key) {
		const fullKey = this.getKey(key);
		const entry = this.store.get(fullKey);
		if (entry) {
			entry.lastAccessed = Date.now();
			return entry.data;
		}
	}
	set(key, data) {
		const fullKey = this.getKey(key);
		const size = data.length;
		const existing = this.store.get(fullKey);
		if (existing) this.currentSize -= existing.size;
		this.evictLRU(size);
		this.store.set(fullKey, {
			data,
			size,
			lastAccessed: Date.now()
		});
		this.currentSize += size;
		this.notifySubscribers(key, data);
	}
	has(key) {
		return this.store.has(this.getKey(key));
	}
	remove(key) {
		const fullKey = this.getKey(key);
		const entry = this.store.get(fullKey);
		if (entry) {
			this.store.delete(fullKey);
			this.currentSize -= entry.size;
			this.notifySubscribers(key, void 0);
			return true;
		}
		return false;
	}
	clear(options) {
		const shouldNotify = options?.notifySubscribers ?? true;
		this.store.clear();
		this.currentSize = 0;
		if (shouldNotify) this.notifySubscribers(void 0, void 0);
	}
	subscribe(subscriber) {
		this.subscribers.add(subscriber);
		return () => {
			this.subscribers.delete(subscriber);
		};
	}
	get isEmpty() {
		return this.store.size === 0;
	}
};
//#endregion
//#region src/factories.ts
function createComponent(type) {
	const Component = (props) => jsx(type, props);
	Component.displayName = type;
	return Component;
}
function createSlottedComponent(type, slotProps) {
	const Slot = createComponent("Slot");
	const Component = (props) => {
		const { children, ...rest } = props;
		const slots = slotProps.filter((prop) => rest[prop]).map((prop) => Slot({ children: rest[prop] }));
		for (const prop of slotProps) delete rest[prop];
		return jsx(type, {
			...rest,
			children: [children, ...slots].filter(Boolean)
		});
	};
	Component.displayName = type;
	return Component;
}
//#endregion
//#region src/components/action.ts
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
	Destructive: "destructive"
};
PickDate.Type = {
	Date: "date",
	DateTime: "datetime"
};
PickDate.isFullDay = (date) => {
	return date.getHours() === 0 && date.getMinutes() === 0 && date.getSeconds() === 0 && date.getMilliseconds() === 0;
};
const ActionPanel = createComponent("ActionPanel");
const ActionPanelSection = createComponent("ActionPanel.Section");
const ActionPanelSubmenu = createComponent("ActionPanel.Submenu");
ActionPanel.Section = ActionPanelSection;
ActionPanel.Submenu = ActionPanelSubmenu;
//#endregion
//#region src/components/detail.ts
const Detail = createSlottedComponent("Detail", ["metadata"]);
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
//#endregion
//#region src/components/form.ts
const Form = createSlottedComponent("Form", ["searchBarAccessory"]);
const TextField = createComponent("Form.TextField");
const PasswordField = createComponent("Form.PasswordField");
const TextArea = createComponent("Form.TextArea");
const Checkbox = createComponent("Form.Checkbox");
const DatePicker = createComponent("Form.DatePicker");
const TagPicker = createComponent("Form.TagPicker");
const Dropdown$2 = createComponent("Form.Dropdown");
const DropdownItem$2 = createComponent("Form.Dropdown.Item");
const DropdownSection$2 = createComponent("Form.Dropdown.Section");
const FilePicker = createComponent("Form.FilePicker");
const Separator = createComponent("Form.Separator");
const LinkAccessory = createComponent("Form.LinkAccessory");
Form.TextField = TextField;
Form.PasswordField = PasswordField;
Form.TextArea = TextArea;
Form.Checkbox = Checkbox;
Form.DatePicker = DatePicker;
Form.TagPicker = TagPicker;
Form.Dropdown = Dropdown$2;
Form.FilePicker = FilePicker;
Form.Separator = Separator;
Form.LinkAccessory = LinkAccessory;
Dropdown$2.Item = DropdownItem$2;
Dropdown$2.Section = DropdownSection$2;
//#endregion
//#region src/components/grid.ts
const Grid = createSlottedComponent("Grid", ["searchBarAccessory"]);
const Item$1 = createSlottedComponent("Grid.Item", ["actions"]);
const Section$1 = createComponent("Grid.Section");
const EmptyView$1 = createComponent("Grid.EmptyView");
const Dropdown$1 = createComponent("Grid.Dropdown");
const DropdownItem$1 = createComponent("Grid.Dropdown.Item");
const DropdownSection$1 = createComponent("Grid.Dropdown.Section");
Grid.Item = Item$1;
Grid.Section = Section$1;
Grid.Dropdown = Dropdown$1;
Grid.EmptyView = EmptyView$1;
Dropdown$1.Item = DropdownItem$1;
Dropdown$1.Section = DropdownSection$1;
//#endregion
//#region src/components/list.ts
const List = createSlottedComponent("List", ["searchBarAccessory"]);
const Item = createSlottedComponent("List.Item", ["detail", "actions"]);
const Section = createComponent("List.Section");
const EmptyView = createComponent("List.EmptyView");
const Dropdown = createComponent("List.Dropdown");
const DropdownItem = createComponent("List.Dropdown.Item");
const DropdownSection = createComponent("List.Dropdown.Section");
const ItemDetail = createSlottedComponent("List.Item.Detail", ["metadata"]);
const ItemDetailMetadata = createComponent("List.Item.Detail.Metadata");
const ItemDetailMetadataLabel = createComponent("List.Item.Detail.Metadata.Label");
const ItemDetailMetadataLink = createComponent("List.Item.Detail.Metadata.Link");
const ItemDetailMetadataTagList = createComponent("List.Item.Detail.Metadata.TagList");
const ItemDetailMetadataTagListItem = createComponent("List.Item.Detail.Metadata.TagList.Item");
const ItemDetailMetadataSeparator = createComponent("List.Item.Detail.Metadata.Separator");
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
//#endregion
//#region src/feedback/toast.ts
const ToastContext = createContext(null);
const Style = {
	Success: "SUCCESS",
	Failure: "FAILURE",
	Animated: "ANIMATED"
};
let toastCounter = 0;
var Toast = class {
	#id;
	#send;
	#style;
	#title;
	#message;
	constructor(id, options, send) {
		this.#id = id;
		this.#send = send;
		this.#style = options.style ?? Style.Success;
		this.#title = options.title;
		this.#message = options.message;
	}
	get style() {
		return this.#style;
	}
	set style(value) {
		this.#style = value;
		this.#send("toastUpdate", this.#id, { style: value });
	}
	get title() {
		return this.#title;
	}
	set title(value) {
		this.#title = value;
		this.#send("toastUpdate", this.#id, { title: value });
	}
	get message() {
		return this.#message;
	}
	set message(value) {
		this.#message = value;
		this.#send("toastUpdate", this.#id, { message: value ?? null });
	}
	async hide() {
		this.#send("toastHide", this.#id, {});
	}
	async show() {
		this.#send("toastShow", this.#id, {
			style: this.#style,
			title: this.#title,
			message: this.#message ?? null
		});
	}
};
async function showToast(options) {
	const sendFn = globalThis.__clutchToastSend;
	if (!sendFn) {
		console.error("[Toast] __clutchToastSend not available on globalThis");
		return new Toast(`toast-${++toastCounter}`, options, () => {});
	}
	const id = `toast-${++toastCounter}`;
	const toast = new Toast(id, options, sendFn);
	sendFn("toastShow", id, {
		style: options.style ?? Style.Success,
		title: options.title,
		message: options.message ?? null
	});
	return toast;
}
function ToastProvider({ children }) {
	const sendRef = useRef(() => {});
	sendRef.current = useCallback((type, toastId, data) => {
		const socketSend = globalThis.__clutchSocketSend;
		if (!socketSend) {
			console.error("[Toast] __clutchSocketSend not available");
			return;
		}
		socketSend({
			category: "RUNTIME",
			type,
			extensionId: globalThis.__clutchExtensionId ?? "",
			toastId,
			...data
		});
	}, []);
	useEffect(() => {
		if (typeof globalThis !== "undefined") globalThis.__clutchToastSend = sendRef.current;
		return () => {
			if (typeof globalThis !== "undefined") delete globalThis.__clutchToastSend;
		};
	}, []);
	return createElement(ToastContext.Provider, { value: { send: sendRef.current } }, children);
}
//#endregion
//#region src/hooks/navigation.ts
const NavigationContext = createContext(null);
function NavigationProvider({ children }) {
	const [stack, setStack] = useState(() => [children]);
	const [popCallbacks, setPopCallbacks] = useState(/* @__PURE__ */ new Map());
	const push = useCallback((component, onPop) => {
		setStack((prev) => {
			const newStack = [...prev, component];
			if (onPop) setPopCallbacks((callbacks) => {
				const next = new Map(callbacks);
				next.set(newStack.length - 1, onPop);
				return next;
			});
			return newStack;
		});
	}, []);
	const pop = useCallback(() => {
		setStack((prev) => {
			if (prev.length <= 1) return prev;
			const topIndex = prev.length - 1;
			const callback = popCallbacks.get(topIndex);
			if (callback) {
				callback();
				setPopCallbacks((callbacks) => {
					const next = new Map(callbacks);
					next.delete(topIndex);
					return next;
				});
			}
			return prev.slice(0, -1);
		});
	}, [popCallbacks]);
	useEffect(() => {
		if (typeof globalThis !== "undefined") globalThis.__clutchNavigationPop = pop;
		return () => {
			if (typeof globalThis !== "undefined") delete globalThis.__clutchNavigationPop;
		};
	}, [pop]);
	const currentView = stack[stack.length - 1];
	return createElement(NavigationContext.Provider, { value: {
		push,
		pop
	} }, currentView);
}
function useNavigation() {
	const context = useContext(NavigationContext);
	if (!context) throw new Error("useNavigation must be used within NavigationProvider");
	return context;
}
//#endregion
//#region src/preferences.ts
let preferences = {};
function initializePreferences(prefs) {
	preferences = { ...prefs };
}
function getPreferenceValues() {
	return { ...preferences };
}
function resetPreferences() {
	preferences = {};
}
//#endregion
//#region src/index.ts
const clutch = { api: {
	List,
	Grid,
	Form,
	Detail,
	Action,
	ActionPanel,
	NavigationProvider,
	useNavigation,
	getPreferenceValues,
	initializePreferences,
	resetPreferences,
	Cache,
	showToast,
	ToastProvider,
	Toast: {
		...Toast,
		Style
	}
} };
//#endregion
export { Toast, ToastProvider, Style as ToastStyle, clutch, showToast };

//# sourceMappingURL=index.mjs.map
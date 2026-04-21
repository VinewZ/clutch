Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
let react_jsx_runtime = require("react/jsx-runtime");
let react = require("react");
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
		this.get = this.get.bind(this);
		this.set = this.set.bind(this);
		this.has = this.has.bind(this);
		this.remove = this.remove.bind(this);
		this.clear = this.clear.bind(this);
		this.subscribe = this.subscribe.bind(this);
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
	const Component = (props) => (0, react_jsx_runtime.jsx)(type, props);
	Component.displayName = type;
	return Component;
}
function createSlottedComponent(type, slotProps) {
	const Slot = createComponent("Slot");
	const Component = (props) => {
		const { children, ...rest } = props;
		const slots = slotProps.filter((prop) => rest[prop]).map((prop) => Slot({ children: rest[prop] }));
		for (const prop of slotProps) delete rest[prop];
		return (0, react_jsx_runtime.jsx)(type, {
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
const ToastContext = (0, react.createContext)(null);
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
	const sendRef = (0, react.useRef)(() => {});
	sendRef.current = (0, react.useCallback)((type, toastId, data) => {
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
	(0, react.useEffect)(() => {
		if (typeof globalThis !== "undefined") globalThis.__clutchToastSend = sendRef.current;
		return () => {
			if (typeof globalThis !== "undefined") delete globalThis.__clutchToastSend;
		};
	}, []);
	return (0, react.createElement)(ToastContext.Provider, { value: { send: sendRef.current } }, children);
}
//#endregion
//#region src/hooks/navigation.ts
const NavigationContext = (0, react.createContext)(null);
function NavigationProvider({ children }) {
	const [stack, setStack] = (0, react.useState)(() => [children]);
	const [popCallbacks, setPopCallbacks] = (0, react.useState)(/* @__PURE__ */ new Map());
	const push = (0, react.useCallback)((component, onPop) => {
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
	const pop = (0, react.useCallback)(() => {
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
	(0, react.useEffect)(() => {
		if (typeof globalThis !== "undefined") globalThis.__clutchNavigationPop = pop;
		return () => {
			if (typeof globalThis !== "undefined") delete globalThis.__clutchNavigationPop;
		};
	}, [pop]);
	const currentView = stack[stack.length - 1];
	return (0, react.createElement)(NavigationContext.Provider, { value: {
		push,
		pop
	} }, currentView);
}
function useNavigation() {
	const context = (0, react.useContext)(NavigationContext);
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
//#region src/utils/color.ts
const Color = {
	Blue: "clutch-blue",
	Green: "clutch-green",
	Magenta: "clutch-magenta",
	Orange: "clutch-orange",
	Purple: "clutch-purple",
	Red: "clutch-red",
	Yellow: "clutch-yellow",
	PrimaryText: "clutch-primary-text",
	SecondaryText: "clutch-secondary-text"
};
//#endregion
//#region src/utils/icon.ts
const Icon = {
	AddPerson: "lucide:user-plus",
	Airplane: "lucide:plane",
	AirplaneFilled: "lucide:plane",
	AirplaneLanding: "lucide:plane-landing",
	AirplaneTakeoff: "lucide:plane-takeoff",
	Airpods: "lucide:headphones",
	Alarm: "lucide:alarm-clock",
	AlarmRinging: "lucide:bell-ring",
	AlignCentre: "lucide:align-center",
	AlignLeft: "lucide:align-left",
	AlignRight: "lucide:align-right",
	AmericanFootball: "lucide:circle",
	Anchor: "lucide:anchor",
	AppWindow: "lucide:app-window",
	AppWindowGrid2x2: "lucide:layout-grid",
	AppWindowGrid3x3: "lucide:grid-3x3",
	AppWindowList: "lucide:list",
	AppWindowSidebarLeft: "lucide:panel-left",
	AppWindowSidebarRight: "lucide:panel-right",
	ArrowClockwise: "lucide:rotate-cw",
	ArrowCounterClockwise: "lucide:rotate-ccw",
	ArrowDown: "lucide:arrow-down",
	ArrowDownCircle: "lucide:arrow-down-circle",
	ArrowDownCircleFilled: "lucide:arrow-down-circle",
	ArrowLeft: "lucide:arrow-left",
	ArrowLeftCircle: "lucide:arrow-left-circle",
	ArrowLeftCircleFilled: "lucide:arrow-left-circle",
	ArrowNe: "lucide:arrow-up-right",
	ArrowRight: "lucide:arrow-right",
	ArrowRightCircle: "lucide:arrow-right-circle",
	ArrowRightCircleFilled: "lucide:arrow-right-circle",
	ArrowsContract: "lucide:minimize-2",
	ArrowsExpand: "lucide:maximize-2",
	ArrowUp: "lucide:arrow-up",
	ArrowUpCircle: "lucide:arrow-up-circle",
	ArrowUpCircleFilled: "lucide:arrow-up-circle",
	AtSymbol: "lucide:at-sign",
	BandAid: "lucide:bandage",
	BankNote: "lucide:banknote",
	BarChart: "lucide:bar-chart-2",
	BarCode: "lucide:scan-barcode",
	BathTub: "lucide:bath",
	Battery: "lucide:battery",
	BatteryCharging: "lucide:battery-charging",
	BatteryDisabled: "lucide:battery-warning",
	Bell: "lucide:bell",
	BellDisabled: "lucide:bell-off",
	Bike: "lucide:bike",
	Binoculars: "lucide:binoculars",
	Bird: "lucide:bird",
	BlankDocument: "lucide:file",
	Bluetooth: "lucide:bluetooth",
	Boat: "lucide:ship",
	Bold: "lucide:bold",
	Bolt: "lucide:zap",
	BoltDisabled: "lucide:zap-off",
	Book: "lucide:book-open",
	Bookmark: "lucide:bookmark",
	Box: "lucide:box",
	Brush: "lucide:paintbrush",
	Bubble: "lucide:message-circle",
	Bug: "lucide:bug",
	Building: "lucide:building-2",
	BulletPoints: "lucide:list",
	BullsEye: "lucide:target",
	BullsEyeMissed: "lucide:crosshair",
	Buoy: "lucide:life-buoy",
	Calculator: "lucide:calculator",
	Calendar: "lucide:calendar",
	Camera: "lucide:camera",
	Car: "lucide:car",
	Cart: "lucide:shopping-cart",
	Cd: "lucide:disc",
	Center: "lucide:align-center-vertical",
	Check: "lucide:check",
	CheckCircle: "lucide:check-circle",
	CheckList: "lucide:list-checks",
	Checkmark: "lucide:check",
	CheckRosette: "lucide:badge-check",
	ChessPiece: "lucide:chess",
	ChevronDown: "lucide:chevron-down",
	ChevronDownSmall: "lucide:chevrons-down",
	ChevronLeft: "lucide:chevron-left",
	ChevronLeftSmall: "lucide:chevrons-left",
	ChevronRight: "lucide:chevron-right",
	ChevronRightSmall: "lucide:chevrons-right",
	ChevronUp: "lucide:chevron-up",
	ChevronUpDown: "lucide:chevrons-up-down",
	ChevronUpSmall: "lucide:chevrons-up",
	Circle: "lucide:circle",
	CircleDisabled: "lucide:circle-off",
	CircleEllipsis: "lucide:circle-ellipsis",
	CircleFilled: "lucide:circle-dot",
	CircleProgress: "lucide:loader",
	CircleProgress100: "lucide:check-circle-2",
	CircleProgress25: "lucide:loader",
	CircleProgress50: "lucide:loader",
	CircleProgress75: "lucide:loader",
	ClearFormatting: "lucide:remove-formatting",
	Clipboard: "lucide:clipboard",
	Clock: "lucide:clock",
	Cloud: "lucide:cloud",
	CloudLightning: "lucide:cloud-lightning",
	CloudRain: "lucide:cloud-rain",
	CloudSnow: "lucide:cloud-snow",
	CloudSun: "lucide:cloud-sun",
	Code: "lucide:code",
	CodeBlock: "lucide:file-code",
	Cog: "lucide:cog",
	Coin: "lucide:coins",
	Coins: "lucide:coins",
	CommandSymbol: "lucide:command",
	Compass: "lucide:compass",
	ComputerChip: "lucide:cpu",
	Contrast: "lucide:contrast",
	CopyClipboard: "lucide:clipboard-copy",
	CreditCard: "lucide:credit-card",
	CricketBall: "lucide:circle",
	Crop: "lucide:crop",
	Crown: "lucide:crown",
	Crypto: "lucide:bitcoin",
	DeleteDocument: "lucide:file-x",
	Desktop: "lucide:monitor",
	Devices: "lucide:smartphone",
	Dna: "lucide:dna",
	Document: "lucide:file-text",
	Dot: "lucide:circle-dot",
	Download: "lucide:download",
	Droplets: "lucide:droplets",
	Duplicate: "lucide:copy",
	EditShape: "lucide:pen-tool",
	Eject: "lucide:eject",
	Ellipsis: "lucide:ellipsis",
	EllipsisVertical: "lucide:ellipsis-vertical",
	Emoji: "lucide:smile",
	EmojiSad: "lucide:frown",
	Envelope: "lucide:mail",
	Eraser: "lucide:eraser",
	ExclamationMark: "lucide:alert-triangle",
	Exclamationmark: "lucide:alert-triangle",
	Exclamationmark2: "lucide:alert-circle",
	Exclamationmark3: "lucide:alert-octagon",
	Eye: "lucide:eye",
	EyeDisabled: "lucide:eye-off",
	EyeDropper: "lucide:pipette",
	Female: "lucide:venus",
	FilmStrip: "lucide:film",
	Filter: "lucide:filter",
	Finder: "lucide:folder-search",
	Fingerprint: "lucide:fingerprint",
	Flag: "lucide:flag",
	Folder: "lucide:folder",
	Footprints: "lucide:footprints",
	Forward: "lucide:fast-forward",
	ForwardFilled: "lucide:fast-forward",
	FountainTip: "lucide:pen-fancy",
	FullSignal: "lucide:signal",
	GameController: "lucide:gamepad-2",
	Gauge: "lucide:gauge",
	Gear: "lucide:settings",
	Geopin: "lucide:map-pin",
	Germ: "lucide:bug",
	Gift: "lucide:gift",
	Glasses: "lucide:glasses",
	Globe: "lucide:globe",
	Goal: "lucide:goal",
	Hammer: "lucide:hammer",
	HardDrive: "lucide:hard-drive",
	Hashtag: "lucide:hash",
	Heading: "lucide:heading",
	Headphones: "lucide:headphones",
	Heart: "lucide:heart",
	HeartDisabled: "lucide:heart-off",
	Heartbeat: "lucide:heart-pulse",
	Highlight: "lucide:highlighter",
	Hourglass: "lucide:hourglass",
	House: "lucide:house",
	Humidity: "lucide:droplets",
	Image: "lucide:image",
	Important: "lucide:alert-triangle",
	Info: "lucide:info",
	Italics: "lucide:italic",
	Key: "lucide:key",
	Keyboard: "lucide:keyboard",
	Layers: "lucide:layers",
	Leaderboard: "lucide:trophy",
	Leaf: "lucide:leaf",
	LevelMeter: "lucide:signal",
	LightBulb: "lucide:lightbulb",
	LightBulbOff: "lucide:lightbulb-off",
	LineChart: "lucide:line-chart",
	Link: "lucide:link",
	List: "lucide:list",
	Livestream: "lucide:radio",
	LivestreamDisabled: "lucide:radio-off",
	Lock: "lucide:lock",
	LockDisabled: "lucide:lock-off",
	LockUnlocked: "lucide:unlock",
	Logout: "lucide:log-out",
	Lorry: "lucide:truck",
	Lowercase: "lucide:a-large-small",
	MagnifyingGlass: "lucide:search",
	Male: "lucide:mars",
	Map: "lucide:map",
	Mask: "lucide:scan-face",
	Maximize: "lucide:maximize",
	MedicalSupport: "lucide:stethoscope",
	Megaphone: "lucide:megaphone",
	MemoryChip: "lucide:cpu",
	MemoryStick: "lucide:usb",
	Message: "lucide:message-square",
	Microphone: "lucide:mic",
	MicrophoneDisabled: "lucide:mic-off",
	Minimize: "lucide:minimize",
	Minus: "lucide:minus",
	MinusCircle: "lucide:minus-circle",
	MinusCircleFilled: "lucide:minus-circle",
	Mobile: "lucide:smartphone",
	Monitor: "lucide:monitor",
	Moon: "lucide:moon",
	MoonDown: "lucide:moon-set",
	MoonUp: "lucide:moon-rise",
	Moonrise: "lucide:moon-star",
	Mountain: "lucide:mountain",
	Mouse: "lucide:mouse",
	Move: "lucide:move",
	Mug: "lucide:mug-hot",
	MugSteam: "lucide:coffee",
	Multiply: "lucide:x",
	Music: "lucide:music",
	Network: "lucide:network",
	NewDocument: "lucide:file-plus",
	NewFolder: "lucide:folder-plus",
	Paperclip: "lucide:paperclip",
	Paragraph: "lucide:paragraph",
	Patch: "lucide:bandage",
	Pause: "lucide:pause",
	PauseFilled: "lucide:pause",
	Pencil: "lucide:pencil",
	Person: "lucide:user",
	PersonCircle: "lucide:user-circle",
	PersonLines: "lucide:user-check",
	Phone: "lucide:phone",
	PhoneRinging: "lucide:phone-call",
	PieChart: "lucide:pie-chart",
	Pill: "lucide:pill",
	Pin: "lucide:pin",
	PinDisabled: "lucide:pin-off",
	Play: "lucide:play",
	PlayFilled: "lucide:play",
	Plug: "lucide:plug",
	Plus: "lucide:plus",
	PlusCircle: "lucide:plus-circle",
	PlusCircleFilled: "lucide:plus-circle",
	PlusMinusDivideMultiply: "lucide:calculator",
	PlusSquare: "lucide:square-plus",
	PlusTopRightSquare: "lucide:square-plus",
	Power: "lucide:power",
	Print: "lucide:printer",
	QuestionMark: "lucide:help-circle",
	QuestionMarkCircle: "lucide:help-circle",
	Quicklink: "lucide:link-2",
	QuotationMarks: "lucide:quote",
	QuoteBlock: "lucide:text-quote",
	Racket: "lucide:circle",
	Raindrop: "lucide:droplet",
	RaycastLogoNeg: "lucide:zap-off",
	RaycastLogoPos: "lucide:zap",
	Receipt: "lucide:receipt",
	Redo: "lucide:redo-2",
	RemovePerson: "lucide:user-minus",
	Repeat: "lucide:repeat",
	Replace: "lucide:replace",
	ReplaceOne: "lucide:replace",
	Reply: "lucide:reply",
	Rewind: "lucide:rewind",
	RewindFilled: "lucide:rewind",
	Rocket: "lucide:rocket",
	Rosette: "lucide:award",
	RotateAntiClockwise: "lucide:rotate-ccw",
	RotateClockwise: "lucide:rotate-cw",
	Rss: "lucide:rss",
	Ruler: "lucide:ruler",
	SaveDocument: "lucide:save",
	Shield: "lucide:shield",
	ShortParagraph: "lucide:text",
	Shuffle: "lucide:shuffle",
	Sidebar: "lucide:panel-right",
	Signal0: "lucide:signal-zero",
	Signal1: "lucide:signal-low",
	Signal2: "lucide:signal-medium",
	Signal3: "lucide:signal-high",
	Snippets: "lucide:scissors",
	Snowflake: "lucide:snowflake",
	SoccerBall: "lucide:circle",
	Speaker: "lucide:speaker",
	SpeakerDown: "lucide:volume-1",
	SpeakerHigh: "lucide:volume-2",
	SpeakerLow: "lucide:volume-1",
	SpeakerOff: "lucide:volume-x",
	SpeakerOn: "lucide:volume-2",
	SpeakerUp: "lucide:volume-2",
	SpeechBubble: "lucide:message-circle",
	SpeechBubbleActive: "lucide:message-circle",
	SpeechBubbleImportant: "lucide:message-circle-warning",
	SquareEllipsis: "lucide:square-ellipsis",
	StackedBars1: "lucide:bar-chart",
	StackedBars2: "lucide:bar-chart-2",
	StackedBars3: "lucide:bar-chart-3",
	StackedBars4: "lucide:bar-chart-4",
	Star: "lucide:star",
	StarCircle: "lucide:star-circle",
	StarDisabled: "lucide:star-off",
	Stars: "lucide:sparkles",
	Stop: "lucide:stop-circle",
	StopFilled: "lucide:stop-circle",
	Stopwatch: "lucide:timer",
	Store: "lucide:store",
	StrikeThrough: "lucide:strikethrough",
	Sun: "lucide:sun",
	Sunrise: "lucide:sunrise",
	Swatch: "lucide:palette",
	Switch: "lucide:toggle-right",
	Syringe: "lucide:syringe",
	Tack: "lucide:map-pin",
	TackDisabled: "lucide:map-pin-off",
	Tag: "lucide:tag",
	Temperature: "lucide:thermometer",
	TennisBall: "lucide:circle",
	Terminal: "lucide:terminal",
	Text: "lucide:type",
	TextCursor: "lucide:text-cursor",
	TextInput: "lucide:text-cursor-input",
	TextSelection: "lucide:selection",
	ThumbsDown: "lucide:thumbs-down",
	ThumbsDownFilled: "lucide:thumbs-down",
	ThumbsUp: "lucide:thumbs-up",
	ThumbsUpFilled: "lucide:thumbs-up",
	Ticket: "lucide:ticket",
	Torch: "lucide:flashlight",
	Train: "lucide:train-front",
	Trash: "lucide:trash-2",
	Tray: "lucide:tray",
	Tree: "lucide:tree-pine",
	Trophy: "lucide:trophy",
	TwoPeople: "lucide:users",
	Umbrella: "lucide:umbrella",
	Underline: "lucide:underline",
	Undo: "lucide:undo-2",
	Upload: "lucide:upload",
	Uppercase: "lucide:a-large-small",
	Video: "lucide:video",
	VideoDisabled: "lucide:video-off",
	Wallet: "lucide:wallet",
	Wand: "lucide:wand-sparkles",
	Warning: "lucide:alert-triangle",
	Waveform: "lucide:audio-waveform",
	Weights: "lucide:dumbbell",
	Wifi: "lucide:wifi",
	WifiDisabled: "lucide:wifi-off",
	Wind: "lucide:wind",
	Window: "lucide:app-window",
	Windsock: "lucide:wind",
	WrenchScrewdriver: "lucide:wrench",
	WristWatch: "lucide:watch",
	Xmark: "lucide:x",
	XMarkCircle: "lucide:x-circle",
	XMarkCircleFilled: "lucide:x-circle",
	XMarkCircleHalfDash: "lucide:circle-slash",
	XMarkTopRightSquare: "lucide:square-x"
};
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
	Toast: Object.assign(Toast, { Style }),
	Color,
	Icon
} };
//#endregion
exports.Color = Color;
exports.Icon = Icon;
exports.Toast = Toast;
exports.ToastProvider = ToastProvider;
exports.ToastStyle = Style;
exports.clutch = clutch;
exports.showToast = showToast;

//# sourceMappingURL=index.cjs.map
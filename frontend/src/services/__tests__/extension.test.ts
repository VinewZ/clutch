import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@wailsio/runtime", () => ({
	Events: {
		On: vi.fn().mockReturnValue(vi.fn()),
	},
}));

vi.mock("bindings/github.com/vinewz/clutch/internal/extension", () => ({
	ExtensionService: {
		SendEvent: vi.fn().mockResolvedValue(undefined),
		SendAction: vi.fn().mockResolvedValue(undefined),
		GetLastRender: vi.fn().mockResolvedValue(null),
		StartExtension: vi.fn().mockResolvedValue(null),
		StopExtension: vi.fn().mockResolvedValue(undefined),
		NavigationPop: vi.fn().mockResolvedValue(undefined),
	},
}));

import { ExtensionService } from "bindings/github.com/vinewz/clutch/internal/extension";
import { sendAction, sendEvent } from "../extension";

describe("event serialization", () => {
	beforeEach(() => {
		vi.mocked(ExtensionService.SendEvent).mockClear();
		vi.mocked(ExtensionService.SendAction).mockClear();
	});

	describe("sendEvent", () => {
		it("passes the event object directly (not JSON.stringify)", async () => {
			const event = { searchText: "hello" };
			await sendEvent("handler-123", event);

			expect(ExtensionService.SendEvent).toHaveBeenCalledWith(
				"handler-123",
				event,
			);
			const [, eventArg] = vi.mocked(ExtensionService.SendEvent).mock.calls[0];
			expect(typeof eventArg).not.toBe("string");
			expect(eventArg).toEqual(event);
		});

		it("event object survives Wails single-encoding round-trip", async () => {
			const event = { searchText: "hello" };
			await sendEvent("handler-123", event);

			const [, eventArg] = vi.mocked(ExtensionService.SendEvent).mock.calls[0];
			const wailsBody = JSON.stringify({ args: [null, eventArg] });
			const parsed = JSON.parse(wailsBody);
			const rawMessage = parsed.args[1];

			expect(typeof rawMessage).toBe("object");
			expect(rawMessage.searchText).toBe("hello");
		});

		it("regression: JSON.stringify wrapping would double-encode", () => {
			const event = { searchText: "hello" };
			const stringified = JSON.stringify(event);

			const wailsBody = JSON.stringify({ args: [null, stringified] });
			const parsed = JSON.parse(wailsBody);
			const rawMessage = parsed.args[1];

			expect(typeof rawMessage).toBe("string");
			expect(rawMessage.searchText).toBeUndefined();
		});
	});

	describe("sendAction", () => {
		it("passes the props object directly (not JSON.stringify)", async () => {
			const props = { title: "Copy", text: "copied" };
			await sendAction("ClipboardAction", props, "handler-456");

			expect(ExtensionService.SendAction).toHaveBeenCalledWith(
				"ClipboardAction",
				props,
				"handler-456",
			);
			const [, propsArg] = vi.mocked(ExtensionService.SendAction).mock.calls[0];
			expect(typeof propsArg).not.toBe("string");
			expect(propsArg).toEqual(props);
		});

		it("props object survives Wails single-encoding round-trip", async () => {
			const props = { title: "Copy" };
			await sendAction("ClipboardAction", props);

			const [, propsArg] = vi.mocked(ExtensionService.SendAction).mock.calls[0];
			const wailsBody = JSON.stringify({ args: [null, propsArg, null] });
			const parsed = JSON.parse(wailsBody);
			const rawMessage = parsed.args[1];

			expect(typeof rawMessage).toBe("object");
			expect(rawMessage.title).toBe("Copy");
		});

		it("regression: JSON.stringify wrapping would double-encode props", () => {
			const props = { title: "Copy" };
			const stringified = JSON.stringify(props);

			const wailsBody = JSON.stringify({ args: [null, stringified, null] });
			const parsed = JSON.parse(wailsBody);
			const rawMessage = parsed.args[1];

			expect(typeof rawMessage).toBe("string");
			expect(rawMessage.title).toBeUndefined();
		});
	});
});

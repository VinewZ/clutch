import { beforeEach, describe, expect, it } from "vitest";
import { clearAllHandlers, handlerRegistry } from "../handler-registry";
import { clearExtensionContext, setExtensionContext } from "../host-config";
import { createReconciler, createRoot } from "../index";

describe("Reconciler Integration", () => {
	beforeEach(() => {
		clearAllHandlers();
		clearExtensionContext();
	});

	describe("createReconciler", () => {
		it("should create renderer with render and unmount methods", () => {
			const renderer = createReconciler();

			expect(renderer.render).toBeDefined();
			expect(renderer.unmount).toBeDefined();
		});

		it("should handle unmount", () => {
			const renderer = createReconciler();

			renderer.unmount();
		});
	});

	describe("createRoot", () => {
		it("should create root with required methods", () => {
			const root = createRoot();

			expect(root.render).toBeDefined();
			expect(root.unmount).toBeDefined();
			expect(root.getSnapshot).toBeDefined();
			expect(root.subscribe).toBeDefined();
		});

		it("should support subscribe for updates", () => {
			let _updateCount = 0;
			const root = createRoot({
				onUpdate: () => {
					_updateCount++;
				},
			});

			const unsubscribe = root.subscribe(() => {
				_updateCount++;
			});

			expect(typeof unsubscribe).toBe("function");
			unsubscribe();
		});
	});

	describe("extension context", () => {
		it("should set and clear extension context", () => {
			setExtensionContext("test-extension");
			expect(
				handlerRegistry.getExtensionHandlers("test-extension"),
			).toHaveLength(0);
			clearExtensionContext();
		});
	});
});

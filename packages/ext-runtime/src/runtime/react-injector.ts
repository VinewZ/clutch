let isInjected = false;

export function injectReact(): void {
	if (isInjected) return;
	isInjected = true;
}

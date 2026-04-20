let preferences: Record<string, unknown> = {};

export function initializePreferences(prefs: Record<string, unknown>): void {
	preferences = { ...prefs };
}

export function getPreferenceValues<T = Record<string, unknown>>(): T {
	return { ...preferences } as T;
}

export function resetPreferences(): void {
	preferences = {};
}

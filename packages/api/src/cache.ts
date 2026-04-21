interface CacheEntry {
	data: string;
	size: number;
	lastAccessed: number;
}

export interface CacheOptions {
	capacity?: number;
	namespace?: string;
}

export type CacheSubscriber = (
	key: string | undefined,
	data: string | undefined,
) => void;

export type CacheSubscription = () => void;

export class Cache {
	private store: Map<string, CacheEntry> = new Map();
	private subscribers: Set<CacheSubscriber> = new Set();
	private namespace?: string;
	private capacity: number;
	private currentSize: number = 0;

	constructor(options?: CacheOptions) {
		this.capacity = options?.capacity ?? 10 * 1024 * 1024;
		this.namespace = options?.namespace;

		this.get = this.get.bind(this);
		this.set = this.set.bind(this);
		this.has = this.has.bind(this);
		this.remove = this.remove.bind(this);
		this.clear = this.clear.bind(this);
		this.subscribe = this.subscribe.bind(this);
	}

	private getKey(key: string): string {
		return this.namespace ? `${this.namespace}:${key}` : key;
	}

	private notifySubscribers(
		key: string | undefined,
		data: string | undefined,
	): void {
		for (const subscriber of this.subscribers) {
			try {
				subscriber(key, data);
			} catch {
				// Ignore subscriber errors
			}
		}
	}

	private evictLRU(neededSize: number): void {
		if (this.currentSize + neededSize <= this.capacity) {
			return;
		}

		const entries = Array.from(this.store.entries());
		entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

		for (const [key, entry] of entries) {
			if (this.currentSize + neededSize <= this.capacity) {
				break;
			}
			this.store.delete(key);
			this.currentSize -= entry.size;
		}
	}

	get(key: string): string | undefined {
		const fullKey = this.getKey(key);
		const entry = this.store.get(fullKey);
		if (entry) {
			entry.lastAccessed = Date.now();
			return entry.data;
		}
		return undefined;
	}

	set(key: string, data: string): void {
		const fullKey = this.getKey(key);
		const size = data.length;

		const existing = this.store.get(fullKey);
		if (existing) {
			this.currentSize -= existing.size;
		}

		this.evictLRU(size);

		this.store.set(fullKey, {
			data,
			size,
			lastAccessed: Date.now(),
		});
		this.currentSize += size;

		this.notifySubscribers(key, data);
	}

	has(key: string): boolean {
		return this.store.has(this.getKey(key));
	}

	remove(key: string): boolean {
		const fullKey = this.getKey(key);
		const entry = this.store.get(fullKey);
		if (entry) {
			this.store.delete(fullKey);
			this.currentSize -= entry.size;
			this.notifySubscribers(key, undefined);
			return true;
		}
		return false;
	}

	clear(options?: { notifySubscribers?: boolean }): void {
		const shouldNotify = options?.notifySubscribers ?? true;

		this.store.clear();
		this.currentSize = 0;

		if (shouldNotify) {
			this.notifySubscribers(undefined, undefined);
		}
	}

	subscribe(subscriber: CacheSubscriber): CacheSubscription {
		this.subscribers.add(subscriber);
		return () => {
			this.subscribers.delete(subscriber);
		};
	}

	get isEmpty(): boolean {
		return this.store.size === 0;
	}
}

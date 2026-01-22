/**
 * QueryCache
 *
 * In-memory cache for frequent database queries.
 * Provides TTL-based invalidation and manual cache management.
 */

interface CacheEntry<T> {
	data: T;
	timestamp: number;
	ttl: number;
}

/**
 * Default TTL in milliseconds (5 minutes)
 * This is long because game data doesn't change during a session
 */
const DEFAULT_TTL = 5 * 60 * 1000;

/**
 * Cache storage
 */
const cache = new Map<string, CacheEntry<unknown>>();

/**
 * QueryCache provides caching for expensive queries
 */
export const QueryCache = {
	/**
	 * Get a cached value or execute the query function
	 */
	async getOrFetch<T>(key: string, fetchFn: () => Promise<T>, ttl: number = DEFAULT_TTL): Promise<T> {
		const existing = cache.get(key);

		// Check if cached value exists and is still valid
		if (existing && Date.now() - existing.timestamp < existing.ttl) {
			return existing.data as T;
		}

		// Fetch new data
		const data = await fetchFn();

		// Store in cache
		cache.set(key, {
			data,
			timestamp: Date.now(),
			ttl
		});

		return data;
	},

	/**
	 * Get a cached value without fetching
	 */
	get<T>(key: string): T | null {
		const existing = cache.get(key);

		if (existing && Date.now() - existing.timestamp < existing.ttl) {
			return existing.data as T;
		}

		return null;
	},

	/**
	 * Set a cached value
	 */
	set<T>(key: string, data: T, ttl: number = DEFAULT_TTL): void {
		cache.set(key, {
			data,
			timestamp: Date.now(),
			ttl
		});
	},

	/**
	 * Check if a key exists and is valid
	 */
	has(key: string): boolean {
		const existing = cache.get(key);
		return existing !== undefined && Date.now() - existing.timestamp < existing.ttl;
	},

	/**
	 * Invalidate a specific cache key
	 */
	invalidate(key: string): void {
		cache.delete(key);
	},

	/**
	 * Invalidate all keys matching a prefix
	 */
	invalidatePrefix(prefix: string): void {
		for (const key of cache.keys()) {
			if (key.startsWith(prefix)) {
				cache.delete(key);
			}
		}
	},

	/**
	 * Clear the entire cache
	 */
	clear(): void {
		cache.clear();
	},

	/**
	 * Get cache statistics
	 */
	getStats(): { size: number; keys: string[] } {
		return {
			size: cache.size,
			keys: Array.from(cache.keys())
		};
	},

	/**
	 * Remove expired entries
	 */
	cleanup(): number {
		const now = Date.now();
		let removed = 0;

		for (const [key, entry] of cache.entries()) {
			if (now - entry.timestamp >= entry.ttl) {
				cache.delete(key);
				removed++;
			}
		}

		return removed;
	}
};

/**
 * Cache key generators for common queries
 */
export const CacheKeys = {
	/** All items of a type */
	all: (type: string) => `all:${type}`,

	/** Single item by ID */
	byId: (id: string) => `id:${id}`,

	/** Items by level */
	byLevel: (type: string, level: number) => `level:${type}:${level}`,

	/** Items by category */
	byCategory: (type: string, category: string) => `cat:${type}:${category}`,

	/** Items by trait */
	byTrait: (type: string, trait: string) => `trait:${type}:${trait}`,

	/** Items by tradition (spells) */
	byTradition: (tradition: string) => `tradition:${tradition}`,

	/** Items by ancestry (heritages) */
	byAncestry: (ancestrySlug: string) => `ancestry:${ancestrySlug}`,

	/** Search results */
	search: (type: string, query: string) => `search:${type}:${query.toLowerCase()}`,

	/** All traits for a type */
	traits: (type: string) => `traits:${type}`,

	/** Filter results (hash the options) */
	filter: (options: Record<string, unknown>) => `filter:${JSON.stringify(options)}`
};

export default QueryCache;

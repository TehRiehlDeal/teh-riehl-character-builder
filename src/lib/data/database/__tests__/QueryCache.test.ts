/**
 * Tests for QueryCache
 *
 * Covers core caching, manual cache operations, utilities, and TTL testing
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('QueryCache', () => {
	let QueryCache: any;
	let CacheKeys: any;

	beforeEach(async () => {
		// Import fresh module
		vi.resetModules();
		const module = await import('../QueryCache');
		QueryCache = module.QueryCache;
		CacheKeys = module.CacheKeys;

		// Clear cache before each test
		QueryCache.clear();
	});

	afterEach(() => {
		QueryCache.clear();
		vi.useRealTimers();
	});

	describe('Core Caching', () => {
		it('getOrFetch() should call fetchFn on cache miss', async () => {
			const fetchFn = vi.fn().mockResolvedValue('test-data');

			const result = await QueryCache.getOrFetch('test-key', fetchFn);

			expect(fetchFn).toHaveBeenCalledTimes(1);
			expect(result).toBe('test-data');
		});

		it('getOrFetch() should return cached value on cache hit', async () => {
			const fetchFn = vi.fn().mockResolvedValue('test-data');

			// First call - cache miss
			const result1 = await QueryCache.getOrFetch('test-key', fetchFn);
			expect(fetchFn).toHaveBeenCalledTimes(1);
			expect(result1).toBe('test-data');

			// Second call - cache hit
			const result2 = await QueryCache.getOrFetch('test-key', fetchFn);
			expect(fetchFn).toHaveBeenCalledTimes(1); // Still only called once
			expect(result2).toBe('test-data');
		});

		it('getOrFetch() should call fetchFn again after TTL expires', async () => {
			vi.useFakeTimers();
			const fetchFn = vi.fn().mockResolvedValue('test-data');

			// First call
			await QueryCache.getOrFetch('test-key', fetchFn, 1000);
			expect(fetchFn).toHaveBeenCalledTimes(1);

			// Advance time past TTL
			vi.advanceTimersByTime(1001);

			// Second call - cache expired, should fetch again
			await QueryCache.getOrFetch('test-key', fetchFn, 1000);
			expect(fetchFn).toHaveBeenCalledTimes(2);
		});

		it('getOrFetch() should use default TTL when not specified', async () => {
			vi.useFakeTimers();
			const fetchFn = vi.fn().mockResolvedValue('test-data');

			// First call
			await QueryCache.getOrFetch('test-key', fetchFn);
			expect(fetchFn).toHaveBeenCalledTimes(1);

			// Advance time by 4 minutes (less than 5 minute default TTL)
			vi.advanceTimersByTime(4 * 60 * 1000);

			// Second call - should still be cached
			await QueryCache.getOrFetch('test-key', fetchFn);
			expect(fetchFn).toHaveBeenCalledTimes(1);

			// Advance time past 5 minutes
			vi.advanceTimersByTime(2 * 60 * 1000);

			// Third call - cache expired
			await QueryCache.getOrFetch('test-key', fetchFn);
			expect(fetchFn).toHaveBeenCalledTimes(2);
		});

		it('get() should return cached value within TTL', async () => {
			QueryCache.set('test-key', 'test-value', 1000);

			const result = QueryCache.get('test-key');

			expect(result).toBe('test-value');
		});

		it('get() should return null when key not found', () => {
			const result = QueryCache.get('nonexistent-key');

			expect(result).toBeNull();
		});

		it('get() should return null when entry expired', () => {
			vi.useFakeTimers();

			QueryCache.set('test-key', 'test-value', 1000);

			// Advance time past TTL
			vi.advanceTimersByTime(1001);

			const result = QueryCache.get('test-key');

			expect(result).toBeNull();
		});
	});

	describe('Manual Cache Operations', () => {
		it('set() should store value with custom TTL', () => {
			vi.useFakeTimers();

			QueryCache.set('test-key', 'test-value', 2000);

			// Should be available within TTL
			expect(QueryCache.get('test-key')).toBe('test-value');

			// Should expire after TTL
			vi.advanceTimersByTime(2001);
			expect(QueryCache.get('test-key')).toBeNull();
		});

		it('set() should use default TTL when not specified', () => {
			vi.useFakeTimers();

			QueryCache.set('test-key', 'test-value');

			// Should be available after 4 minutes
			vi.advanceTimersByTime(4 * 60 * 1000);
			expect(QueryCache.get('test-key')).toBe('test-value');

			// Should expire after 5 minutes
			vi.advanceTimersByTime(2 * 60 * 1000);
			expect(QueryCache.get('test-key')).toBeNull();
		});

		it('has() should return true for valid entry', () => {
			QueryCache.set('test-key', 'test-value');

			expect(QueryCache.has('test-key')).toBe(true);
		});

		it('has() should return false for expired entry', () => {
			vi.useFakeTimers();

			QueryCache.set('test-key', 'test-value', 1000);

			expect(QueryCache.has('test-key')).toBe(true);

			vi.advanceTimersByTime(1001);

			expect(QueryCache.has('test-key')).toBe(false);
		});

		it('has() should return false for missing entry', () => {
			expect(QueryCache.has('nonexistent-key')).toBe(false);
		});

		it('invalidate() should remove single key', () => {
			QueryCache.set('key1', 'value1');
			QueryCache.set('key2', 'value2');

			QueryCache.invalidate('key1');

			expect(QueryCache.get('key1')).toBeNull();
			expect(QueryCache.get('key2')).toBe('value2');
		});

		it('invalidatePrefix() should remove matching keys', () => {
			QueryCache.set('feat:key1', 'value1');
			QueryCache.set('feat:key2', 'value2');
			QueryCache.set('spell:key1', 'value3');

			QueryCache.invalidatePrefix('feat:');

			expect(QueryCache.get('feat:key1')).toBeNull();
			expect(QueryCache.get('feat:key2')).toBeNull();
			expect(QueryCache.get('spell:key1')).toBe('value3');
		});

		it('invalidatePrefix() should handle empty prefix', () => {
			QueryCache.set('key1', 'value1');
			QueryCache.set('key2', 'value2');

			QueryCache.invalidatePrefix('');

			// All keys start with empty string, so all should be removed
			expect(QueryCache.get('key1')).toBeNull();
			expect(QueryCache.get('key2')).toBeNull();
		});

		it('clear() should remove all entries', () => {
			QueryCache.set('key1', 'value1');
			QueryCache.set('key2', 'value2');
			QueryCache.set('key3', 'value3');

			QueryCache.clear();

			expect(QueryCache.get('key1')).toBeNull();
			expect(QueryCache.get('key2')).toBeNull();
			expect(QueryCache.get('key3')).toBeNull();
		});
	});

	describe('Utilities', () => {
		it('getStats() should return size and keys', () => {
			QueryCache.set('key1', 'value1');
			QueryCache.set('key2', 'value2');
			QueryCache.set('key3', 'value3');

			const stats = QueryCache.getStats();

			expect(stats.size).toBe(3);
			expect(stats.keys).toEqual(['key1', 'key2', 'key3']);
		});

		it('getStats() should return empty stats for empty cache', () => {
			const stats = QueryCache.getStats();

			expect(stats.size).toBe(0);
			expect(stats.keys).toEqual([]);
		});

		it('cleanup() should remove expired entries and return count', () => {
			vi.useFakeTimers();

			QueryCache.set('key1', 'value1', 1000);
			QueryCache.set('key2', 'value2', 2000);
			QueryCache.set('key3', 'value3', 3000);

			// Advance past first two TTLs
			vi.advanceTimersByTime(2001);

			const removed = QueryCache.cleanup();

			expect(removed).toBe(2);
			expect(QueryCache.get('key1')).toBeNull();
			expect(QueryCache.get('key2')).toBeNull();
			expect(QueryCache.get('key3')).toBe('value3');
		});

		it('cleanup() should return 0 when no entries expired', () => {
			QueryCache.set('key1', 'value1', 10000);
			QueryCache.set('key2', 'value2', 10000);

			const removed = QueryCache.cleanup();

			expect(removed).toBe(0);
			expect(QueryCache.get('key1')).toBe('value1');
			expect(QueryCache.get('key2')).toBe('value2');
		});

		it('cleanup() should return 0 for empty cache', () => {
			const removed = QueryCache.cleanup();

			expect(removed).toBe(0);
		});
	});

	describe('TTL Testing', () => {
		it('should respect custom TTL values', () => {
			vi.useFakeTimers();

			QueryCache.set('short', 'value', 1000);
			QueryCache.set('long', 'value', 5000);

			// After 1.5 seconds
			vi.advanceTimersByTime(1500);

			expect(QueryCache.get('short')).toBeNull(); // Expired
			expect(QueryCache.get('long')).toBe('value'); // Still valid

			// After 5.5 seconds total
			vi.advanceTimersByTime(4000);

			expect(QueryCache.get('long')).toBeNull(); // Now expired
		});

		it('should allow updating cached value before expiry', () => {
			vi.useFakeTimers();

			QueryCache.set('key', 'value1', 2000);

			// After 1 second, update the value
			vi.advanceTimersByTime(1000);
			QueryCache.set('key', 'value2', 2000);

			// Value should be updated and still valid
			expect(QueryCache.get('key')).toBe('value2');

			// After 1.9 more seconds (2.9 total), should still be valid from second set
			// (second set was at t=1000 with TTL=2000, so valid until t=3000)
			vi.advanceTimersByTime(1900);
			expect(QueryCache.get('key')).toBe('value2');

			// After 0.1 more seconds (3 total), should be expired
			vi.advanceTimersByTime(100);
			expect(QueryCache.get('key')).toBeNull();
		});

		it('should handle zero TTL correctly', () => {
			vi.useFakeTimers();

			QueryCache.set('key', 'value', 0);

			// Should expire immediately
			expect(QueryCache.get('key')).toBeNull();
		});
	});

	describe('CacheKeys helpers', () => {
		it('should generate correct cache keys', () => {
			expect(CacheKeys.all('feat')).toBe('all:feat');
			expect(CacheKeys.byId('feat-123')).toBe('id:feat-123');
			expect(CacheKeys.byLevel('feat', 5)).toBe('level:feat:5');
			expect(CacheKeys.byCategory('feat', 'general')).toBe('cat:feat:general');
			expect(CacheKeys.byTrait('feat', 'general')).toBe('trait:feat:general');
			expect(CacheKeys.byTradition('arcane')).toBe('tradition:arcane');
			expect(CacheKeys.byAncestry('elf')).toBe('ancestry:elf');
			expect(CacheKeys.search('feat', 'Test Query')).toBe('search:feat:test query');
			expect(CacheKeys.traits('feat')).toBe('traits:feat');
		});

		it('filter key should serialize options consistently', () => {
			const options1 = { type: 'feat', level: 5, rarity: 'common' };
			const options2 = { type: 'feat', level: 5, rarity: 'common' };

			const key1 = CacheKeys.filter(options1);
			const key2 = CacheKeys.filter(options2);

			expect(key1).toBe(key2);
		});

		it('filter key should differentiate different options', () => {
			const options1 = { type: 'feat', level: 5 };
			const options2 = { type: 'feat', level: 6 };

			const key1 = CacheKeys.filter(options1);
			const key2 = CacheKeys.filter(options2);

			expect(key1).not.toBe(key2);
		});
	});
});

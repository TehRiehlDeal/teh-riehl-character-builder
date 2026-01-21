/**
 * Data Loader
 *
 * Provides utilities for loading game data using manifests.
 * Uses fetch for loading files from the static directory and caching for performance.
 */

import type { DataManifest, ManifestEntry } from './manifests/types';

/**
 * Base path for data files in static directory
 */
const DATA_BASE_PATH = '/data';

/**
 * Cache for loaded manifests
 */
const manifestCache = new Map<string, DataManifest>();

/**
 * Cache for loaded data files
 */
const dataCache = new Map<string, unknown>();

/**
 * Load a manifest file
 */
async function loadManifest(category: string): Promise<DataManifest> {
	if (manifestCache.has(category)) {
		return manifestCache.get(category)!;
	}

	try {
		// Fetch the manifest file from static directory
		const response = await fetch(`${DATA_BASE_PATH}/manifests/${category}.json`);
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}
		const manifest = (await response.json()) as DataManifest;
		manifestCache.set(category, manifest);
		return manifest;
	} catch (error) {
		console.error(`Failed to load manifest for ${category}:`, error);
		throw new Error(`Manifest not found: ${category}`);
	}
}

/**
 * Load a single data file
 */
async function loadDataFile<T>(category: string, filePath: string): Promise<T> {
	const cacheKey = `${category}:${filePath}`;

	if (dataCache.has(cacheKey)) {
		return dataCache.get(cacheKey) as T;
	}

	try {
		// Fetch the data file from static directory
		const response = await fetch(`${DATA_BASE_PATH}/raw/${category}/${filePath}`);
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}
		const data = (await response.json()) as T;
		dataCache.set(cacheKey, data);
		return data;
	} catch (error) {
		console.error(`Failed to load data file ${category}/${filePath}:`, error);
		throw new Error(`Data file not found: ${category}/${filePath}`);
	}
}

/**
 * Load all data files for a category
 */
export async function loadAllData<T>(category: string): Promise<T[]> {
	const manifest = await loadManifest(category);
	const results: T[] = [];

	// Load all files in parallel (with batching to avoid overwhelming the browser)
	const batchSize = 50;
	for (let i = 0; i < manifest.entries.length; i += batchSize) {
		const batch = manifest.entries.slice(i, i + batchSize);
		const promises = batch.map((entry) => loadDataFile<T>(category, entry.path));
		const batchResults = await Promise.all(promises);
		results.push(...batchResults);
	}

	return results;
}

/**
 * Load data files by IDs
 */
export async function loadDataByIds<T>(category: string, ids: string[]): Promise<T[]> {
	const manifest = await loadManifest(category);
	const results: T[] = [];

	for (const id of ids) {
		const entry = manifest.entries.find((e) => e.id === id);
		if (entry) {
			const data = await loadDataFile<T>(category, entry.path);
			results.push(data);
		}
	}

	return results;
}

/**
 * Load a single data file by ID
 */
export async function loadDataById<T>(category: string, id: string): Promise<T | null> {
	const manifest = await loadManifest(category);
	const entry = manifest.entries.find((e) => e.id === id);

	if (!entry) {
		return null;
	}

	return loadDataFile<T>(category, entry.path);
}

/**
 * Get manifest entries matching a filter
 */
export async function getManifestEntries(
	category: string,
	filter?: (entry: ManifestEntry) => boolean
): Promise<ManifestEntry[]> {
	const manifest = await loadManifest(category);

	if (!filter) {
		return manifest.entries;
	}

	return manifest.entries.filter(filter);
}

/**
 * Load data files matching a filter
 */
export async function loadDataByFilter<T>(
	category: string,
	filter: (entry: ManifestEntry) => boolean
): Promise<T[]> {
	const entries = await getManifestEntries(category, filter);
	const results: T[] = [];

	// Load in batches
	const batchSize = 50;
	for (let i = 0; i < entries.length; i += batchSize) {
		const batch = entries.slice(i, i + batchSize);
		const promises = batch.map((entry) => loadDataFile<T>(category, entry.path));
		const batchResults = await Promise.all(promises);
		results.push(...batchResults);
	}

	return results;
}

/**
 * Clear all caches
 */
export function clearDataCache(): void {
	manifestCache.clear();
	dataCache.clear();
}

/**
 * Clear cache for a specific category
 */
export function clearCategoryCache(category: string): void {
	manifestCache.delete(category);

	// Clear all data cache entries for this category
	const keysToDelete: string[] = [];
	for (const key of dataCache.keys()) {
		if (key.startsWith(`${category}:`)) {
			keysToDelete.push(key);
		}
	}
	keysToDelete.forEach((key) => dataCache.delete(key));
}

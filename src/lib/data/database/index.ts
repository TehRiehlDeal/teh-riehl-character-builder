/**
 * Database Module
 *
 * Provides SQLite-based data access for the PF2e Character Builder.
 * Uses sql.js (WASM) for client-side SQLite queries.
 */

export { DatabaseManager, default as db } from './DatabaseManager';
export {
	QueryBuilder,
	type ItemType,
	type BaseFilterOptions,
	type FeatFilterOptions,
	type SpellFilterOptions,
	type EquipmentFilterOptions,
	type HeritageFilterOptions,
	type FilterOptions
} from './QueryBuilder';
export { QueryCache, CacheKeys } from './QueryCache';

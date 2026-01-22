/**
 * QueryBuilder
 *
 * Provides type-safe query construction for common data access patterns.
 */

import { DatabaseManager } from './DatabaseManager';

/**
 * Item types in the database
 */
export type ItemType =
	| 'feat'
	| 'ancestry'
	| 'heritage'
	| 'background'
	| 'class'
	| 'spell'
	| 'equipment'
	| 'action'
	| 'condition'
	| 'effect';

/**
 * Base filter options for items
 */
export interface BaseFilterOptions {
	type: ItemType;
	level?: number;
	minLevel?: number;
	maxLevel?: number;
	rarity?: string;
	trait?: string;
	traits?: string[];
	traitsMode?: 'any' | 'all';
	search?: string;
	limit?: number;
	offset?: number;
	orderBy?: 'name' | 'level';
	orderDir?: 'ASC' | 'DESC';
}

/**
 * Feat-specific filter options
 */
export interface FeatFilterOptions extends BaseFilterOptions {
	type: 'feat';
	category?: 'general' | 'skill' | 'class' | 'ancestry' | 'archetype' | 'classfeature';
}

/**
 * Spell-specific filter options
 */
export interface SpellFilterOptions extends BaseFilterOptions {
	type: 'spell';
	tradition?: string;
	traditions?: string[];
	spellType?: 'standard' | 'focus' | 'ritual';
}

/**
 * Equipment-specific filter options
 */
export interface EquipmentFilterOptions extends BaseFilterOptions {
	type: 'equipment';
	equipmentType?: 'weapon' | 'armor' | 'shield' | 'consumable' | 'adventuring-gear' | 'other';
	category?: string;
}

/**
 * Heritage-specific filter options
 */
export interface HeritageFilterOptions extends BaseFilterOptions {
	type: 'heritage';
	ancestrySlug?: string;
}

/**
 * Union of all filter options
 */
export type FilterOptions =
	| FeatFilterOptions
	| SpellFilterOptions
	| EquipmentFilterOptions
	| HeritageFilterOptions
	| BaseFilterOptions;

/**
 * Build a WHERE clause from filter options
 */
function buildWhereClause(
	options: FilterOptions
): { clause: string; params: unknown[]; joins: string[] } {
	const conditions: string[] = [];
	const params: unknown[] = [];
	const joins: string[] = [];

	// Type filter
	conditions.push('i.type = ?');
	params.push(options.type);

	// Level filters
	if (options.level !== undefined) {
		conditions.push('i.level = ?');
		params.push(options.level);
	}
	if (options.minLevel !== undefined) {
		conditions.push('i.level >= ?');
		params.push(options.minLevel);
	}
	if (options.maxLevel !== undefined) {
		conditions.push('i.level <= ?');
		params.push(options.maxLevel);
	}

	// Rarity filter
	if (options.rarity) {
		conditions.push('i.rarity = ?');
		params.push(options.rarity);
	}

	// Single trait filter
	if (options.trait) {
		joins.push('JOIN item_traits t ON i.id = t.item_id');
		conditions.push('t.trait = ?');
		params.push(options.trait);
	}

	// Multiple traits filter
	if (options.traits && options.traits.length > 0) {
		if (options.traitsMode === 'all') {
			// Item must have ALL specified traits
			for (let i = 0; i < options.traits.length; i++) {
				const alias = `t${i}`;
				joins.push(`JOIN item_traits ${alias} ON i.id = ${alias}.item_id`);
				conditions.push(`${alias}.trait = ?`);
				params.push(options.traits[i]);
			}
		} else {
			// Item must have ANY of the specified traits (default)
			joins.push('JOIN item_traits t ON i.id = t.item_id');
			const placeholders = options.traits.map(() => '?').join(', ');
			conditions.push(`t.trait IN (${placeholders})`);
			params.push(...options.traits);
		}
	}

	// Feat-specific: category filter
	if (options.type === 'feat' && (options as FeatFilterOptions).category) {
		joins.push('JOIN feat_categories fc ON i.id = fc.item_id');
		conditions.push('fc.category = ?');
		params.push((options as FeatFilterOptions).category);
	}

	// Spell-specific: tradition filter
	if (options.type === 'spell') {
		const spellOpts = options as SpellFilterOptions;
		if (spellOpts.tradition) {
			joins.push('JOIN spell_traditions st ON i.id = st.item_id');
			conditions.push('st.tradition = ?');
			params.push(spellOpts.tradition);
		}
		if (spellOpts.traditions && spellOpts.traditions.length > 0) {
			joins.push('JOIN spell_traditions st ON i.id = st.item_id');
			const placeholders = spellOpts.traditions.map(() => '?').join(', ');
			conditions.push(`st.tradition IN (${placeholders})`);
			params.push(...spellOpts.traditions);
		}
	}

	// Equipment-specific: equipment type and category
	if (options.type === 'equipment') {
		const equipOpts = options as EquipmentFilterOptions;
		if (equipOpts.equipmentType || equipOpts.category) {
			joins.push('JOIN equipment_meta em ON i.id = em.item_id');
			if (equipOpts.equipmentType) {
				conditions.push('em.equipment_type = ?');
				params.push(equipOpts.equipmentType);
			}
			if (equipOpts.category) {
				conditions.push('em.category = ?');
				params.push(equipOpts.category);
			}
		}
	}

	// Heritage-specific: ancestry filter
	if (options.type === 'heritage' && (options as HeritageFilterOptions).ancestrySlug) {
		joins.push('JOIN heritage_ancestry ha ON i.id = ha.item_id');
		conditions.push('ha.ancestry_slug = ?');
		params.push((options as HeritageFilterOptions).ancestrySlug);
	}

	return {
		clause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
		params,
		joins
	};
}

/**
 * QueryBuilder provides fluent interface for building and executing queries
 */
export const QueryBuilder = {
	/**
	 * Get all items of a specific type
	 */
	async getAll<T>(type: ItemType): Promise<T[]> {
		return DatabaseManager.queryItems<T>('SELECT data FROM items WHERE type = ? ORDER BY name', [
			type
		]);
	},

	/**
	 * Get a single item by ID
	 */
	async getById<T>(id: string): Promise<T | null> {
		return DatabaseManager.queryItem<T>('SELECT data FROM items WHERE id = ?', [id]);
	},

	/**
	 * Get items by IDs
	 */
	async getByIds<T>(ids: string[]): Promise<T[]> {
		if (ids.length === 0) return [];
		const placeholders = ids.map(() => '?').join(', ');
		return DatabaseManager.queryItems<T>(`SELECT data FROM items WHERE id IN (${placeholders})`, ids);
	},

	/**
	 * Filter items with flexible criteria
	 */
	async filter<T>(options: FilterOptions): Promise<T[]> {
		const { clause, params, joins } = buildWhereClause(options);

		// Build ORDER BY
		const orderBy = options.orderBy || 'name';
		const orderDir = options.orderDir || 'ASC';
		const orderClause = `ORDER BY i.${orderBy} ${orderDir}`;

		// Build LIMIT/OFFSET
		let limitClause = '';
		if (options.limit) {
			limitClause = `LIMIT ${options.limit}`;
			if (options.offset) {
				limitClause += ` OFFSET ${options.offset}`;
			}
		}

		// Build and execute query
		const sql = `
			SELECT DISTINCT i.data
			FROM items i
			${joins.join(' ')}
			${clause}
			${orderClause}
			${limitClause}
		`;

		return DatabaseManager.queryItems<T>(sql, params);
	},

	/**
	 * Count items matching filter criteria
	 */
	async countFilter(options: FilterOptions): Promise<number> {
		const { clause, params, joins } = buildWhereClause(options);

		const sql = `
			SELECT COUNT(DISTINCT i.id) as count
			FROM items i
			${joins.join(' ')}
			${clause}
		`;

		return DatabaseManager.count(sql, params);
	},

	/**
	 * Search items by name (case-insensitive LIKE)
	 */
	async searchByName<T>(type: ItemType, query: string): Promise<T[]> {
		const pattern = `%${query}%`;
		return DatabaseManager.queryItems<T>(
			'SELECT data FROM items WHERE type = ? AND name LIKE ? COLLATE NOCASE ORDER BY name',
			[type, pattern]
		);
	},

	/**
	 * Full-text search across name and description
	 */
	async fullTextSearch<T>(type: ItemType, query: string): Promise<T[]> {
		return DatabaseManager.searchText<T>(query, type);
	},

	/**
	 * Get items by trait
	 */
	async getByTrait<T>(type: ItemType, trait: string): Promise<T[]> {
		return this.filter<T>({ type, trait } as FilterOptions);
	},

	/**
	 * Get items by level
	 */
	async getByLevel<T>(type: ItemType, level: number): Promise<T[]> {
		return DatabaseManager.queryItems<T>(
			'SELECT data FROM items WHERE type = ? AND level = ? ORDER BY name',
			[type, level]
		);
	},

	/**
	 * Get items available at character level (level <= characterLevel)
	 */
	async getAvailableAtLevel<T>(type: ItemType, characterLevel: number): Promise<T[]> {
		return DatabaseManager.queryItems<T>(
			'SELECT data FROM items WHERE type = ? AND level <= ? ORDER BY level, name',
			[type, characterLevel]
		);
	},

	/**
	 * Get distinct values for a column (useful for filters)
	 */
	async getDistinctValues(type: ItemType, column: 'rarity' | 'level'): Promise<string[]> {
		const rows = await DatabaseManager.query<Record<string, unknown>>(
			`SELECT DISTINCT ${column} FROM items WHERE type = ? ORDER BY ${column}`,
			[type]
		);
		return rows.map((row) => String(row[column]));
	},

	/**
	 * Get all traits used by a type
	 */
	async getTraitsForType(type: ItemType): Promise<string[]> {
		const rows = await DatabaseManager.query<{ trait: string }>(
			`SELECT DISTINCT t.trait
			 FROM item_traits t
			 JOIN items i ON t.item_id = i.id
			 WHERE i.type = ?
			 ORDER BY t.trait`,
			[type]
		);
		return rows.map((r) => r.trait);
	}
};

export default QueryBuilder;

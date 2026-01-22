/**
 * DatabaseManager
 *
 * Manages the SQLite database connection using sql.js (WASM).
 * Provides query methods for accessing game data.
 */

// Types are defined in ./sql.js.d.ts
type SqlJsStatic = import('sql.js').SqlJsStatic;
type Database = import('sql.js').Database;

// Database state
let sqlPromise: Promise<SqlJsStatic> | null = null;
let dbPromise: Promise<Database> | null = null;
let db: Database | null = null;

/**
 * Initialize sql.js WASM
 */
async function initSql(): Promise<SqlJsStatic> {
	if (sqlPromise) {
		return sqlPromise;
	}

	sqlPromise = (async () => {
		// Dynamic import to avoid SSR issues
		const initSqlJs = (await import('sql.js')).default;

		// Initialize with WASM file location
		const SQL = await initSqlJs({
			locateFile: (file: string) => `/wasm/${file}`
		});

		return SQL;
	})();

	return sqlPromise;
}

/**
 * Load the database from the static directory
 */
async function loadDatabase(): Promise<Database> {
	if (dbPromise) {
		return dbPromise;
	}

	dbPromise = (async () => {
		const SQL = await initSql();

		// Fetch the database file
		const response = await fetch('/data/pf2e.db');
		if (!response.ok) {
			throw new Error(`Failed to load database: ${response.status} ${response.statusText}`);
		}

		const buffer = await response.arrayBuffer();
		const data = new Uint8Array(buffer);

		// Create database from loaded data
		db = new SQL.Database(data);
		return db;
	})();

	return dbPromise;
}

/**
 * DatabaseManager singleton
 *
 * Provides methods for querying the SQLite database.
 */
export const DatabaseManager = {
	/**
	 * Initialize the database connection
	 * Call this early in the app lifecycle
	 */
	async initialize(): Promise<void> {
		await loadDatabase();
	},

	/**
	 * Check if database is initialized
	 */
	isInitialized(): boolean {
		return db !== null;
	},

	/**
	 * Execute a query and return all results
	 */
	async query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
		const database = await loadDatabase();
		const stmt = database.prepare(sql);
		stmt.bind(params);

		const results: T[] = [];
		while (stmt.step()) {
			const row = stmt.getAsObject() as Record<string, unknown>;
			results.push(row as T);
		}
		stmt.free();

		return results;
	},

	/**
	 * Execute a query and return the first result
	 */
	async queryOne<T>(sql: string, params: unknown[] = []): Promise<T | null> {
		const results = await this.query<T>(sql, params);
		return results.length > 0 ? results[0] : null;
	},

	/**
	 * Execute a query and return parsed JSON data from the 'data' column
	 * This is the common pattern for item queries
	 */
	async queryItems<T>(sql: string, params: unknown[] = []): Promise<T[]> {
		const rows = await this.query<{ data: string }>(sql, params);
		return rows.map((row) => JSON.parse(row.data) as T);
	},

	/**
	 * Execute a query and return a single parsed JSON item
	 */
	async queryItem<T>(sql: string, params: unknown[] = []): Promise<T | null> {
		const row = await this.queryOne<{ data: string }>(sql, params);
		return row ? (JSON.parse(row.data) as T) : null;
	},

	/**
	 * Get the count of items matching a query
	 */
	async count(sql: string, params: unknown[] = []): Promise<number> {
		const result = await this.queryOne<{ count: number }>(sql, params);
		return result?.count ?? 0;
	},

	/**
	 * Full-text search across item names and descriptions
	 */
	async searchText<T>(query: string, type?: string): Promise<T[]> {
		// Escape special FTS characters
		const escapedQuery = query.replace(/['"*()]/g, ' ').trim();
		if (!escapedQuery) return [];

		let sql: string;
		const params: unknown[] = [];

		if (type) {
			sql = `
				SELECT i.data
				FROM items i
				JOIN items_fts fts ON i.rowid = fts.docid
				WHERE items_fts MATCH ? AND i.type = ?
				ORDER BY i.name
			`;
			params.push(escapedQuery + '*', type);
		} else {
			sql = `
				SELECT i.data
				FROM items i
				JOIN items_fts fts ON i.rowid = fts.docid
				WHERE items_fts MATCH ?
				ORDER BY i.name
			`;
			params.push(escapedQuery + '*');
		}

		return this.queryItems<T>(sql, params);
	},

	/**
	 * Get database metadata
	 */
	async getMeta(key: string): Promise<string | null> {
		const result = await this.queryOne<{ value: string }>(
			'SELECT value FROM meta WHERE key = ?',
			[key]
		);
		return result?.value ?? null;
	},

	/**
	 * Get database build info
	 */
	async getBuildInfo(): Promise<{ version: string; buildTime: string } | null> {
		const version = await this.getMeta('version');
		const buildTime = await this.getMeta('buildTime');
		if (!version || !buildTime) return null;
		return { version, buildTime };
	},

	/**
	 * Close the database connection
	 */
	close(): void {
		if (db) {
			db.close();
			db = null;
			dbPromise = null;
		}
	}
};

export default DatabaseManager;

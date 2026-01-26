/**
 * Test utilities for mocking sql.js and DatabaseManager
 *
 * Provides reusable mock infrastructure for database testing
 */

import { vi } from 'vitest';
import type { Database, Statement, SqlJsStatic } from 'sql.js';

/**
 * Create a mock SQL statement with predefined results
 * @param rows - Array of row objects to return
 * @returns Mock Statement object
 */
export function createMockStatement(rows: Record<string, unknown>[] = []): Statement {
	let currentIndex = 0;

	return {
		bind: vi.fn().mockReturnValue(true),
		step: vi.fn(() => {
			const hasMore = currentIndex < rows.length;
			if (hasMore) {
				currentIndex++;
			}
			return hasMore;
		}),
		getAsObject: vi.fn(() => {
			return currentIndex > 0 && currentIndex <= rows.length ? rows[currentIndex - 1] : {};
		}),
		get: vi.fn(() => {
			const row = currentIndex > 0 && currentIndex <= rows.length ? rows[currentIndex - 1] : {};
			return Object.values(row);
		}),
		reset: vi.fn(),
		free: vi.fn()
	} as unknown as Statement;
}

/**
 * Create a mock Database instance
 * @param preparedStatements - Map of SQL strings to their mock statements
 * @returns Mock Database object
 */
export function createMockDatabase(
	preparedStatements: Map<string, Statement> = new Map()
): Database {
	return {
		prepare: vi.fn((sql: string) => {
			// Return specific statement if mapped, otherwise return empty statement
			return preparedStatements.get(sql) || createMockStatement([]);
		}),
		run: vi.fn(),
		exec: vi.fn(() => []),
		export: vi.fn(() => new Uint8Array()),
		close: vi.fn()
	} as unknown as Database;
}

/**
 * Create a mock SqlJsStatic instance
 * @param database - Optional mock database to use
 * @returns Mock SqlJsStatic object
 */
export function createMockSqlJsStatic(database?: Database): SqlJsStatic {
	const mockDb = database || createMockDatabase();

	// Create a constructor function that returns the mock database
	const DatabaseConstructor = function (this: Database, data?: ArrayLike<number>) {
		return mockDb;
	} as unknown as new (data?: ArrayLike<number>) => Database;

	return {
		Database: DatabaseConstructor
	} as SqlJsStatic;
}

/**
 * Mock the sql.js module for testing
 * Call this in your test setup to mock the sql.js WASM module
 *
 * @param sqlJsStatic - Optional custom SqlJsStatic instance
 * @returns The mock SqlJsStatic instance
 *
 * @example
 * ```typescript
 * beforeEach(() => {
 *   const mockSql = mockSqlJs();
 *   // Configure your mock database here
 * });
 * ```
 */
export function mockSqlJs(sqlJsStatic?: SqlJsStatic) {
	const mockSql = sqlJsStatic || createMockSqlJsStatic();

	vi.doMock('sql.js', () => ({
		default: vi.fn().mockResolvedValue(mockSql)
	}));

	return mockSql;
}

/**
 * Mock global fetch for database file loading
 * @param data - Optional Uint8Array to return as database data
 * @param options - Mock response options
 */
export function mockDatabaseFetch(
	data: Uint8Array = new Uint8Array(8),
	options: { ok?: boolean; status?: number; statusText?: string } = {}
) {
	const { ok = true, status = 200, statusText = 'OK' } = options;

	const mockFetch = vi.fn().mockResolvedValue({
		ok,
		status,
		statusText,
		arrayBuffer: () => Promise.resolve(data.buffer)
	});

	vi.stubGlobal('fetch', mockFetch);
	return mockFetch;
}

/**
 * Create spies on DatabaseManager methods for testing
 * Use this to verify that repositories and other code call DatabaseManager correctly
 *
 * @returns Object with spies for all DatabaseManager methods
 *
 * @example
 * ```typescript
 * const dbSpies = spyOnDatabaseManager();
 * dbSpies.queryItems.mockResolvedValue([mockFeat]);
 * await getAllFeats();
 * expect(dbSpies.queryItems).toHaveBeenCalledWith(expectedSql, expectedParams);
 * ```
 */
export function spyOnDatabaseManager() {
	// Note: This needs to be called after DatabaseManager is imported
	// and will spy on the actual module methods
	const { DatabaseManager } = require('../DatabaseManager');

	return {
		initialize: vi.spyOn(DatabaseManager, 'initialize'),
		isInitialized: vi.spyOn(DatabaseManager, 'isInitialized'),
		query: vi.spyOn(DatabaseManager, 'query'),
		queryOne: vi.spyOn(DatabaseManager, 'queryOne'),
		queryItems: vi.spyOn(DatabaseManager, 'queryItems'),
		queryItem: vi.spyOn(DatabaseManager, 'queryItem'),
		count: vi.spyOn(DatabaseManager, 'count'),
		searchText: vi.spyOn(DatabaseManager, 'searchText'),
		getMeta: vi.spyOn(DatabaseManager, 'getMeta'),
		getBuildInfo: vi.spyOn(DatabaseManager, 'getBuildInfo'),
		close: vi.spyOn(DatabaseManager, 'close')
	};
}

/**
 * Reset all database-related mocks
 * Call this in afterEach to clean up between tests
 */
export function resetDatabaseMocks() {
	vi.resetModules();
	vi.clearAllMocks();
	if (global.fetch && vi.isMockFunction(global.fetch)) {
		(global.fetch as ReturnType<typeof vi.fn>).mockReset();
	}
}

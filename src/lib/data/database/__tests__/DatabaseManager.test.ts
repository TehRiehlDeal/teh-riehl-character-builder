/**
 * Tests for DatabaseManager
 *
 * Covers initialization, query methods, specialized methods, and state management
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
	createMockStatement,
	createMockDatabase,
	createMockSqlJsStatic,
	mockDatabaseFetch,
	resetDatabaseMocks
} from './testUtils';

describe('DatabaseManager', () => {
	let mockDb: ReturnType<typeof createMockDatabase>;
	let mockSql: ReturnType<typeof createMockSqlJsStatic>;

	beforeEach(() => {
		// Create fresh mocks
		mockDb = createMockDatabase();
		mockSql = createMockSqlJsStatic(mockDb);

		// Mock fetch for database file (must be set before resetting modules)
		mockDatabaseFetch();

		// Reset modules to clear any cached state
		vi.resetModules();

		// Mock sql.js module after reset
		vi.doMock('sql.js', () => ({
			default: vi.fn().mockResolvedValue(mockSql)
		}));
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('Initialization', () => {
		it('should initialize database successfully', async () => {
			const { DatabaseManager } = await import('../DatabaseManager');

			await DatabaseManager.initialize();

			expect(DatabaseManager.isInitialized()).toBe(true);
			expect(global.fetch).toHaveBeenCalledWith('/data/pf2e.db');
		});

		it('should be idempotent - multiple initialize() calls return same promise', async () => {
			const { DatabaseManager } = await import('../DatabaseManager');

			const promise1 = DatabaseManager.initialize();
			const promise2 = DatabaseManager.initialize();

			// Both promises should resolve successfully
			await promise1;
			await promise2;

			// And both should result in initialized state
			expect(DatabaseManager.isInitialized()).toBe(true);

			// If we call initialize again, it should return immediately with same state
			await DatabaseManager.initialize();
			expect(DatabaseManager.isInitialized()).toBe(true);
		});

		it('should handle 404 fetch error', async () => {
			mockDatabaseFetch(new Uint8Array(8), { ok: false, status: 404, statusText: 'Not Found' });

			const { DatabaseManager } = await import('../DatabaseManager');

			await expect(DatabaseManager.initialize()).rejects.toThrow(
				'Failed to load database: 404 Not Found'
			);
		});

		it('should handle 500 fetch error', async () => {
			mockDatabaseFetch(new Uint8Array(8), {
				ok: false,
				status: 500,
				statusText: 'Internal Server Error'
			});

			const { DatabaseManager } = await import('../DatabaseManager');

			await expect(DatabaseManager.initialize()).rejects.toThrow(
				'Failed to load database: 500 Internal Server Error'
			);
		});

		it('should handle network error', async () => {
			vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

			const { DatabaseManager } = await import('../DatabaseManager');

			await expect(DatabaseManager.initialize()).rejects.toThrow('Network error');
		});

		it('should handle sql.js WASM initialization failure', async () => {
			vi.doMock('sql.js', () => ({
				default: vi.fn().mockRejectedValue(new Error('WASM initialization failed'))
			}));

			const { DatabaseManager } = await import('../DatabaseManager');

			await expect(DatabaseManager.initialize()).rejects.toThrow('WASM initialization failed');
		});

		it('should return false for isInitialized() before initialization', async () => {
			const { DatabaseManager } = await import('../DatabaseManager');

			expect(DatabaseManager.isInitialized()).toBe(false);
		});
	});

	describe('Query Methods', () => {
		beforeEach(async () => {
			const { DatabaseManager } = await import('../DatabaseManager');
			await DatabaseManager.initialize();
		});

		it('query() should return all results with parameter binding', async () => {
			const mockRows = [
				{ id: 'test-1', name: 'Test 1' },
				{ id: 'test-2', name: 'Test 2' }
			];
			const mockStmt = createMockStatement(mockRows);
			mockDb.prepare = vi.fn().mockReturnValue(mockStmt);

			const { DatabaseManager } = await import('../DatabaseManager');
			const results = await DatabaseManager.query('SELECT * FROM items WHERE type = ?', [
				'feat'
			]);

			expect(mockDb.prepare).toHaveBeenCalledWith('SELECT * FROM items WHERE type = ?');
			expect(mockStmt.bind).toHaveBeenCalledWith(['feat']);
			expect(mockStmt.step).toHaveBeenCalled();
			expect(mockStmt.free).toHaveBeenCalled();
			expect(results).toEqual(mockRows);
		});

		it('query() should handle empty results', async () => {
			const mockStmt = createMockStatement([]);
			mockDb.prepare = vi.fn().mockReturnValue(mockStmt);

			const { DatabaseManager } = await import('../DatabaseManager');
			const results = await DatabaseManager.query('SELECT * FROM items WHERE id = ?', [
				'nonexistent'
			]);

			expect(results).toEqual([]);
		});

		it('query() should work without parameters', async () => {
			const mockRows = [{ count: 100 }];
			const mockStmt = createMockStatement(mockRows);
			mockDb.prepare = vi.fn().mockReturnValue(mockStmt);

			const { DatabaseManager } = await import('../DatabaseManager');
			const results = await DatabaseManager.query('SELECT COUNT(*) as count FROM items');

			expect(mockStmt.bind).toHaveBeenCalledWith([]);
			expect(results).toEqual(mockRows);
		});

		it('queryOne() should return first result', async () => {
			const mockRows = [
				{ id: 'test-1', name: 'Test 1' },
				{ id: 'test-2', name: 'Test 2' }
			];
			const mockStmt = createMockStatement(mockRows);
			mockDb.prepare = vi.fn().mockReturnValue(mockStmt);

			const { DatabaseManager } = await import('../DatabaseManager');
			const result = await DatabaseManager.queryOne('SELECT * FROM items WHERE id = ?', [
				'test-1'
			]);

			expect(result).toEqual(mockRows[0]);
		});

		it('queryOne() should return null when no results', async () => {
			const mockStmt = createMockStatement([]);
			mockDb.prepare = vi.fn().mockReturnValue(mockStmt);

			const { DatabaseManager } = await import('../DatabaseManager');
			const result = await DatabaseManager.queryOne('SELECT * FROM items WHERE id = ?', [
				'nonexistent'
			]);

			expect(result).toBeNull();
		});

		it('queryItems() should parse JSON data column', async () => {
			const mockData = [
				{ id: 'feat-1', name: 'Feat 1', type: 'feat' },
				{ id: 'feat-2', name: 'Feat 2', type: 'feat' }
			];
			const mockRows = mockData.map((data) => ({ data: JSON.stringify(data) }));
			const mockStmt = createMockStatement(mockRows);
			mockDb.prepare = vi.fn().mockReturnValue(mockStmt);

			const { DatabaseManager } = await import('../DatabaseManager');
			const results = await DatabaseManager.queryItems('SELECT data FROM items WHERE type = ?', [
				'feat'
			]);

			expect(results).toEqual(mockData);
		});

		it('queryItems() should handle empty results', async () => {
			const mockStmt = createMockStatement([]);
			mockDb.prepare = vi.fn().mockReturnValue(mockStmt);

			const { DatabaseManager } = await import('../DatabaseManager');
			const results = await DatabaseManager.queryItems(
				'SELECT data FROM items WHERE type = ?',
				['nonexistent']
			);

			expect(results).toEqual([]);
		});

		it('queryItem() should return single parsed item', async () => {
			const mockData = { id: 'feat-1', name: 'Feat 1', type: 'feat' };
			const mockRows = [{ data: JSON.stringify(mockData) }];
			const mockStmt = createMockStatement(mockRows);
			mockDb.prepare = vi.fn().mockReturnValue(mockStmt);

			const { DatabaseManager } = await import('../DatabaseManager');
			const result = await DatabaseManager.queryItem('SELECT data FROM items WHERE id = ?', [
				'feat-1'
			]);

			expect(result).toEqual(mockData);
		});

		it('queryItem() should return null when no result', async () => {
			const mockStmt = createMockStatement([]);
			mockDb.prepare = vi.fn().mockReturnValue(mockStmt);

			const { DatabaseManager } = await import('../DatabaseManager');
			const result = await DatabaseManager.queryItem('SELECT data FROM items WHERE id = ?', [
				'nonexistent'
			]);

			expect(result).toBeNull();
		});
	});

	describe('Specialized Methods', () => {
		beforeEach(async () => {
			const { DatabaseManager } = await import('../DatabaseManager');
			await DatabaseManager.initialize();
		});

		it('count() should return numeric count', async () => {
			const mockRows = [{ count: 42 }];
			const mockStmt = createMockStatement(mockRows);
			mockDb.prepare = vi.fn().mockReturnValue(mockStmt);

			const { DatabaseManager } = await import('../DatabaseManager');
			const count = await DatabaseManager.count('SELECT COUNT(*) as count FROM items');

			expect(count).toBe(42);
		});

		it('count() should return 0 when no result', async () => {
			const mockStmt = createMockStatement([]);
			mockDb.prepare = vi.fn().mockReturnValue(mockStmt);

			const { DatabaseManager } = await import('../DatabaseManager');
			const count = await DatabaseManager.count('SELECT COUNT(*) as count FROM items');

			expect(count).toBe(0);
		});

		it('count() should return 0 when count is null', async () => {
			const mockRows = [{ count: null }];
			const mockStmt = createMockStatement(mockRows);
			mockDb.prepare = vi.fn().mockReturnValue(mockStmt);

			const { DatabaseManager } = await import('../DatabaseManager');
			const count = await DatabaseManager.count('SELECT COUNT(*) as count FROM items');

			expect(count).toBe(0);
		});

		it('searchText() should escape special FTS characters', async () => {
			const mockData = [{ id: 'feat-1', name: 'Test Feat' }];
			const mockRows = mockData.map((data) => ({ data: JSON.stringify(data) }));
			const mockStmt = createMockStatement(mockRows);
			mockDb.prepare = vi.fn().mockReturnValue(mockStmt);

			const { DatabaseManager } = await import('../DatabaseManager');

			// Test with special characters that should be escaped (replaced with spaces)
			await DatabaseManager.searchText('test "quote" *star* (paren)');

			// After escaping special chars and adding wildcard suffix
			expect(mockStmt.bind).toHaveBeenCalledWith(['test  quote   star   paren*']);
		});

		it('searchText() should return empty array for empty query', async () => {
			const { DatabaseManager } = await import('../DatabaseManager');

			const results = await DatabaseManager.searchText('');

			expect(results).toEqual([]);
		});

		it('searchText() should return empty array for whitespace-only query', async () => {
			const { DatabaseManager } = await import('../DatabaseManager');

			const results = await DatabaseManager.searchText('   ');

			expect(results).toEqual([]);
		});

		it('searchText() should filter by type when provided', async () => {
			const mockData = [{ id: 'feat-1', name: 'Test Feat', type: 'feat' }];
			const mockRows = mockData.map((data) => ({ data: JSON.stringify(data) }));
			const mockStmt = createMockStatement(mockRows);
			mockDb.prepare = vi.fn().mockReturnValue(mockStmt);

			const { DatabaseManager } = await import('../DatabaseManager');
			await DatabaseManager.searchText('test', 'feat');

			// Should call with type parameter
			expect(mockStmt.bind).toHaveBeenCalledWith(['test*', 'feat']);
		});

		it('searchText() should not filter by type when not provided', async () => {
			const mockData = [{ id: 'feat-1', name: 'Test Feat' }];
			const mockRows = mockData.map((data) => ({ data: JSON.stringify(data) }));
			const mockStmt = createMockStatement(mockRows);
			mockDb.prepare = vi.fn().mockReturnValue(mockStmt);

			const { DatabaseManager } = await import('../DatabaseManager');
			await DatabaseManager.searchText('test');

			// Should call without type parameter
			expect(mockStmt.bind).toHaveBeenCalledWith(['test*']);
		});

		it('getMeta() should return metadata value', async () => {
			const mockRows = [{ value: '1.0.0' }];
			const mockStmt = createMockStatement(mockRows);
			mockDb.prepare = vi.fn().mockReturnValue(mockStmt);

			const { DatabaseManager } = await import('../DatabaseManager');
			const value = await DatabaseManager.getMeta('version');

			expect(mockDb.prepare).toHaveBeenCalledWith(
				'SELECT value FROM meta WHERE key = ?'
			);
			expect(mockStmt.bind).toHaveBeenCalledWith(['version']);
			expect(value).toBe('1.0.0');
		});

		it('getMeta() should return null when key not found', async () => {
			const mockStmt = createMockStatement([]);
			mockDb.prepare = vi.fn().mockReturnValue(mockStmt);

			const { DatabaseManager } = await import('../DatabaseManager');
			const value = await DatabaseManager.getMeta('nonexistent');

			expect(value).toBeNull();
		});

		it('getBuildInfo() should return version and buildTime', async () => {
			const mockStmt1 = createMockStatement([{ value: '1.0.0' }]);
			const mockStmt2 = createMockStatement([{ value: '2024-01-01T00:00:00Z' }]);

			let callCount = 0;
			mockDb.prepare = vi.fn(() => {
				callCount++;
				return callCount === 1 ? mockStmt1 : mockStmt2;
			});

			const { DatabaseManager } = await import('../DatabaseManager');
			const buildInfo = await DatabaseManager.getBuildInfo();

			expect(buildInfo).toEqual({
				version: '1.0.0',
				buildTime: '2024-01-01T00:00:00Z'
			});
		});

		it('getBuildInfo() should return null when version missing', async () => {
			const mockStmt = createMockStatement([]);
			mockDb.prepare = vi.fn().mockReturnValue(mockStmt);

			const { DatabaseManager } = await import('../DatabaseManager');
			const buildInfo = await DatabaseManager.getBuildInfo();

			expect(buildInfo).toBeNull();
		});

		it('getBuildInfo() should return null when buildTime missing', async () => {
			const mockStmt1 = createMockStatement([{ value: '1.0.0' }]);
			const mockStmt2 = createMockStatement([]);

			let callCount = 0;
			mockDb.prepare = vi.fn(() => {
				callCount++;
				return callCount === 1 ? mockStmt1 : mockStmt2;
			});

			const { DatabaseManager } = await import('../DatabaseManager');
			const buildInfo = await DatabaseManager.getBuildInfo();

			expect(buildInfo).toBeNull();
		});
	});

	describe('State Management', () => {
		it('close() should close database and reset state', async () => {
			const { DatabaseManager } = await import('../DatabaseManager');
			await DatabaseManager.initialize();

			expect(DatabaseManager.isInitialized()).toBe(true);

			DatabaseManager.close();

			expect(mockDb.close).toHaveBeenCalled();
			expect(DatabaseManager.isInitialized()).toBe(false);
		});

		it('close() should be safe when database not initialized', async () => {
			const { DatabaseManager } = await import('../DatabaseManager');

			expect(() => DatabaseManager.close()).not.toThrow();
			expect(DatabaseManager.isInitialized()).toBe(false);
		});

		it('should reinitialize after close()', async () => {
			const { DatabaseManager } = await import('../DatabaseManager');

			await DatabaseManager.initialize();
			expect(DatabaseManager.isInitialized()).toBe(true);

			DatabaseManager.close();
			expect(DatabaseManager.isInitialized()).toBe(false);

			// Should be able to reinitialize
			await DatabaseManager.initialize();
			expect(DatabaseManager.isInitialized()).toBe(true);
		});
	});
});

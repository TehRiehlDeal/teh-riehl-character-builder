/**
 * Type declarations for sql.js
 *
 * sql.js is a JavaScript library that runs SQLite compiled to WebAssembly.
 */

declare module 'sql.js' {
	export interface SqlJsStatic {
		Database: new (data?: ArrayLike<number>) => Database;
	}

	export interface Database {
		run(sql: string, params?: unknown[]): void;
		exec(sql: string): QueryExecResult[];
		prepare(sql: string): Statement;
		export(): Uint8Array;
		close(): void;
	}

	export interface Statement {
		bind(params?: unknown[]): boolean;
		step(): boolean;
		getAsObject(): Record<string, unknown>;
		get(): unknown[];
		reset(): void;
		free(): void;
	}

	export interface QueryExecResult {
		columns: string[];
		values: unknown[][];
	}

	export interface SqlJsOptions {
		locateFile?: (file: string) => string;
	}

	export default function initSqlJs(options?: SqlJsOptions): Promise<SqlJsStatic>;
}

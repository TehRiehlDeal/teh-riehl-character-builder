import { describe, it, expect } from 'vitest';
import {
	getCurrentDataVersion,
	getCurrentVersionMetadata,
	getVersionHistory,
	getVersionMetadata,
	isVersionKnown,
	parseVersion,
	compareVersions,
	isVersionOutdated,
	isVersionNewer,
	getVersionsBetween,
	getChangelogBetween,
	CURRENT_DATA_VERSION
} from './version';

describe('Data Versioning', () => {
	describe('Version Access', () => {
		it('should return current data version', () => {
			const version = getCurrentDataVersion();
			expect(version).toBe(CURRENT_DATA_VERSION);
			expect(version).toMatch(/^data-v\d{4}\.\d{1,2}\.\d+$/);
		});

		it('should return current version metadata', () => {
			const metadata = getCurrentVersionMetadata();
			expect(metadata.version).toBe(CURRENT_DATA_VERSION);
			expect(metadata.importDate).toBeTruthy();
			expect(metadata.foundryCommit).toBeTruthy();
			expect(metadata.changes).toBeInstanceOf(Array);
		});

		it('should return version history', () => {
			const history = getVersionHistory();
			expect(history.length).toBeGreaterThan(0);
			expect(history[0].version).toBe(CURRENT_DATA_VERSION);
		});

		it('should get metadata for specific version', () => {
			const metadata = getVersionMetadata(CURRENT_DATA_VERSION);
			expect(metadata).toBeTruthy();
			expect(metadata?.version).toBe(CURRENT_DATA_VERSION);
		});

		it('should return null for unknown version', () => {
			const metadata = getVersionMetadata('data-v9999.99.99');
			expect(metadata).toBeNull();
		});

		it('should check if version is known', () => {
			expect(isVersionKnown(CURRENT_DATA_VERSION)).toBe(true);
			expect(isVersionKnown('data-v9999.99.99')).toBe(false);
		});
	});

	describe('Version Parsing', () => {
		it('should parse valid version string', () => {
			const parsed = parseVersion('data-v2026.01.1');
			expect(parsed).toEqual({
				year: 2026,
				month: 1,
				patch: 1
			});
		});

		it('should parse version with different numbers', () => {
			const parsed = parseVersion('data-v2025.12.15');
			expect(parsed).toEqual({
				year: 2025,
				month: 12,
				patch: 15
			});
		});

		it('should return null for invalid version format', () => {
			expect(parseVersion('invalid')).toBeNull();
			expect(parseVersion('v2026.01.1')).toBeNull();
			expect(parseVersion('data-2026.01.1')).toBeNull();
			expect(parseVersion('data-v2026')).toBeNull();
		});
	});

	describe('Version Comparison', () => {
		it('should compare versions correctly by year', () => {
			expect(compareVersions('data-v2025.01.1', 'data-v2026.01.1')).toBeLessThan(0);
			expect(compareVersions('data-v2026.01.1', 'data-v2025.01.1')).toBeGreaterThan(0);
			expect(compareVersions('data-v2026.01.1', 'data-v2026.01.1')).toBe(0);
		});

		it('should compare versions correctly by month', () => {
			expect(compareVersions('data-v2026.01.1', 'data-v2026.02.1')).toBeLessThan(0);
			expect(compareVersions('data-v2026.12.1', 'data-v2026.01.1')).toBeGreaterThan(0);
		});

		it('should compare versions correctly by patch', () => {
			expect(compareVersions('data-v2026.01.1', 'data-v2026.01.2')).toBeLessThan(0);
			expect(compareVersions('data-v2026.01.5', 'data-v2026.01.3')).toBeGreaterThan(0);
		});

		it('should handle invalid versions by string comparison', () => {
			const result = compareVersions('invalid-v1', 'invalid-v2');
			expect(typeof result).toBe('number');
		});
	});

	describe('Version Status Checks', () => {
		it('should detect outdated versions', () => {
			const currentParsed = parseVersion(CURRENT_DATA_VERSION);
			if (currentParsed) {
				const olderVersion = `data-v${currentParsed.year}.${currentParsed.month}.${Math.max(0, currentParsed.patch - 1)}`;
				if (currentParsed.patch > 0) {
					expect(isVersionOutdated(olderVersion)).toBe(true);
				}
			}
		});

		it('should detect current version as not outdated', () => {
			expect(isVersionOutdated(CURRENT_DATA_VERSION)).toBe(false);
		});

		it('should detect newer versions', () => {
			const currentParsed = parseVersion(CURRENT_DATA_VERSION);
			if (currentParsed) {
				const newerVersion = `data-v${currentParsed.year}.${currentParsed.month}.${currentParsed.patch + 1}`;
				expect(isVersionNewer(newerVersion)).toBe(true);
			}
		});

		it('should detect current version as not newer', () => {
			expect(isVersionNewer(CURRENT_DATA_VERSION)).toBe(false);
		});
	});

	describe('Changelog Functions', () => {
		it('should get versions between two versions', () => {
			// This test assumes we have at least one version in history
			const history = getVersionHistory();
			if (history.length >= 1) {
				const versions = getVersionsBetween(
					history[0].version,
					history[0].version
				);
				expect(versions.length).toBeGreaterThanOrEqual(1);
			}
		});

		it('should return empty array for unknown versions', () => {
			const versions = getVersionsBetween('data-v9999.99.99', 'data-v9999.99.98');
			expect(versions).toEqual([]);
		});

		it('should get changelog between versions', () => {
			const history = getVersionHistory();
			if (history.length >= 1) {
				const changes = getChangelogBetween(
					history[0].version,
					history[0].version
				);
				expect(changes.length).toBeGreaterThan(0);
			}
		});

		it('should return empty changelog for unknown versions', () => {
			const changes = getChangelogBetween('data-v9999.99.99', 'data-v9999.99.98');
			expect(changes).toEqual([]);
		});
	});
});

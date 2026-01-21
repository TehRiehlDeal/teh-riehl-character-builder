/**
 * Data Version Tracking
 *
 * Tracks the version of game data being used.
 * When data is updated from Foundry VTT, the version is incremented.
 * Characters store the data version they were created with.
 */

/**
 * Current data version
 *
 * Format: data-v{YYYY}.{MM}.{PATCH}
 * Example: data-v2026.01.1
 *
 * This should be updated whenever game data is imported from Foundry VTT.
 */
export const CURRENT_DATA_VERSION = 'data-v2026.01.2';

/**
 * Data version metadata
 */
export interface DataVersion {
	/** Version string (e.g., "data-v2026.01.1") */
	version: string;
	/** Date the data was imported */
	importDate: string; // ISO 8601 format
	/** Foundry VTT commit hash */
	foundryCommit: string;
	/** Summary of changes in this version */
	changes: string[];
}

/**
 * Version history
 *
 * Tracks all data version updates with metadata.
 * Most recent version should be first in the array.
 */
export const VERSION_HISTORY: DataVersion[] = [
	{
		version: 'data-v2026.01.2',
		importDate: '2026-01-18T13:54:35Z',
		foundryCommit: 'f145a17377b58ac16eb528422b609cb28e2be3d7',
		changes: [
			'Complete data import from Foundry VTT PF2e System',
			'Imported all 50 ancestries',
			'Imported all 322 heritages',
			'Imported all 485 backgrounds',
			'Imported all 27 classes',
			'Imported all 5,846 feats (ancestry, class, skill, general, archetype, mythic)',
			'Imported all 1,796 spells (including focus spells and rituals)',
			'Imported all 5,566 equipment items (weapons, armor, gear, consumables)'
		]
	},
	{
		version: 'data-v2026.01.1',
		importDate: '2026-01-18T00:00:00Z',
		foundryCommit: '143b40ea1c91864c6db9c9d849aeae2722348e8f',
		changes: [
			'Initial data import from Foundry VTT PF2e System',
			'Added 3 sample ancestries (Human, Elf, Dwarf)',
			'Added 3 sample classes (Fighter, Wizard, Rogue)',
			'Added 4 sample backgrounds (Acolyte, Acrobat, Scholar, Student of Magic)',
			'Added 3 general feats (Fleet, Toughness, Incredible Initiative)'
		]
	}
];

/**
 * Get the current data version
 */
export function getCurrentDataVersion(): string {
	return CURRENT_DATA_VERSION;
}

/**
 * Get metadata for the current data version
 */
export function getCurrentVersionMetadata(): DataVersion {
	return VERSION_HISTORY[0];
}

/**
 * Get all version history
 */
export function getVersionHistory(): DataVersion[] {
	return VERSION_HISTORY;
}

/**
 * Get metadata for a specific version
 */
export function getVersionMetadata(version: string): DataVersion | null {
	return VERSION_HISTORY.find((v) => v.version === version) ?? null;
}

/**
 * Check if a version exists in history
 */
export function isVersionKnown(version: string): boolean {
	return VERSION_HISTORY.some((v) => v.version === version);
}

/**
 * Parse a version string into components
 *
 * Format: data-v{YEAR}.{MONTH}.{PATCH}
 * Example: "data-v2026.01.1" -> { year: 2026, month: 1, patch: 1 }
 */
export function parseVersion(version: string): {
	year: number;
	month: number;
	patch: number;
} | null {
	const match = version.match(/^data-v(\d{4})\.(\d{1,2})\.(\d+)$/);
	if (!match) {
		return null;
	}

	return {
		year: parseInt(match[1], 10),
		month: parseInt(match[2], 10),
		patch: parseInt(match[3], 10)
	};
}

/**
 * Compare two version strings
 *
 * Returns:
 * - negative number if v1 < v2
 * - 0 if v1 === v2
 * - positive number if v1 > v2
 */
export function compareVersions(v1: string, v2: string): number {
	const parsed1 = parseVersion(v1);
	const parsed2 = parseVersion(v2);

	if (!parsed1 || !parsed2) {
		// If either version is invalid, compare as strings
		return v1.localeCompare(v2);
	}

	// Compare year
	if (parsed1.year !== parsed2.year) {
		return parsed1.year - parsed2.year;
	}

	// Compare month
	if (parsed1.month !== parsed2.month) {
		return parsed1.month - parsed2.month;
	}

	// Compare patch
	return parsed1.patch - parsed2.patch;
}

/**
 * Check if a version is older than the current version
 */
export function isVersionOutdated(version: string): boolean {
	return compareVersions(version, CURRENT_DATA_VERSION) < 0;
}

/**
 * Check if a version is newer than the current version
 */
export function isVersionNewer(version: string): boolean {
	return compareVersions(version, CURRENT_DATA_VERSION) > 0;
}

/**
 * Get all versions between two versions (inclusive)
 */
export function getVersionsBetween(oldVersion: string, newVersion: string): DataVersion[] {
	const startIndex = VERSION_HISTORY.findIndex((v) => v.version === newVersion);
	const endIndex = VERSION_HISTORY.findIndex((v) => v.version === oldVersion);

	if (startIndex === -1 || endIndex === -1) {
		return [];
	}

	return VERSION_HISTORY.slice(startIndex, endIndex + 1);
}

/**
 * Get changelog between two versions
 *
 * Returns all changes that occurred between oldVersion and newVersion.
 */
export function getChangelogBetween(oldVersion: string, newVersion: string): string[] {
	const versions = getVersionsBetween(oldVersion, newVersion);
	const changes: string[] = [];

	for (const version of versions) {
		changes.push(...version.changes);
	}

	return changes;
}

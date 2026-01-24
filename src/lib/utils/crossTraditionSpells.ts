/**
 * Cross-Tradition Spell Access Utilities
 *
 * Handles detection of feats that grant access to spells from other magical traditions.
 * The four magical traditions in PF2e are: Arcane, Divine, Occult, Primal
 */

export type MagicalTradition = 'arcane' | 'divine' | 'occult' | 'primal';

export interface CrossTraditionAccess {
	/** Which traditions can be accessed (empty array = all other traditions) */
	traditions: MagicalTradition[];
	/** Which spell levels can be accessed (empty array = all levels) */
	spellLevels: number[];
	/** Maximum number of spells that can be accessed (undefined = unlimited) */
	maxSpells?: number;
	/** Description of the access granted */
	description: string;
}

/**
 * Registry of feats that grant cross-tradition spell access
 * Maps feat name to the access rules it provides
 */
const CROSS_TRADITION_FEATS: Record<string, CrossTraditionAccess> = {
	'Adapted Cantrip': {
		traditions: [], // All other traditions
		spellLevels: [0], // Cantrips only
		description: 'Choose one cantrip from a magical tradition other than your own'
	},
	'Impossible Polymath': {
		traditions: ['arcane', 'primal', 'divine'], // Bard is occult
		spellLevels: [], // All spell levels
		description: 'Add spells from arcane, primal, or divine traditions to your spellbook'
	},
	'Mysterious Repertoire': {
		traditions: [], // All other traditions
		spellLevels: [], // All spell levels
		maxSpells: 1,
		description: 'Add one spell from another tradition to your repertoire'
	}
	// Add more feats here as needed
};

/**
 * Analyze character feats to determine cross-tradition spell access
 */
export function getCrossTraditionAccess(
	characterFeats: Array<{ name: string }>,
	characterTradition: string | null
): {
	hasAccess: boolean;
	cantripsOnly: boolean;
	allSpells: boolean;
	allowedTraditions: MagicalTradition[];
	description: string;
} {
	const allMagicalTraditions: MagicalTradition[] = ['arcane', 'divine', 'occult', 'primal'];

	// Check if character has any cross-tradition feats
	const grantedAccess: CrossTraditionAccess[] = [];

	for (const feat of characterFeats) {
		const accessRule = CROSS_TRADITION_FEATS[feat.name];
		if (accessRule) {
			grantedAccess.push(accessRule);
		}
	}

	// If no access granted, return defaults
	if (grantedAccess.length === 0) {
		return {
			hasAccess: false,
			cantripsOnly: false,
			allSpells: false,
			allowedTraditions: [],
			description: ''
		};
	}

	// Merge all access rules
	const allSpellLevels = new Set<number>();
	const allTraditions = new Set<MagicalTradition>();
	const descriptions: string[] = [];

	for (const access of grantedAccess) {
		descriptions.push(access.description);

		// Determine which traditions are accessible
		const accessibleTraditions = access.traditions.length > 0
			? access.traditions
			: allMagicalTraditions.filter(t => t !== characterTradition?.toLowerCase());

		for (const tradition of accessibleTraditions) {
			allTraditions.add(tradition);
		}

		// Determine which spell levels are accessible
		if (access.spellLevels.length === 0) {
			// All spell levels
			for (let i = 0; i <= 10; i++) {
				allSpellLevels.add(i);
			}
		} else {
			for (const level of access.spellLevels) {
				allSpellLevels.add(level);
			}
		}
	}

	const allowedLevels = Array.from(allSpellLevels).sort((a, b) => a - b);
	const cantripsOnly = allowedLevels.length === 1 && allowedLevels[0] === 0;
	const allSpells = allowedLevels.length > 1 || (allowedLevels.length === 0);

	return {
		hasAccess: true,
		cantripsOnly,
		allSpells,
		allowedTraditions: Array.from(allTraditions),
		description: descriptions.join('; ')
	};
}

/**
 * Check if a spell from a specific tradition and level can be accessed
 */
export function canAccessSpell(
	spellTradition: MagicalTradition,
	spellLevel: number,
	characterTradition: string | null,
	characterFeats: Array<{ name: string }>
): boolean {
	// If spell is from character's own tradition, always allow
	if (spellTradition === characterTradition?.toLowerCase()) {
		return true;
	}

	const access = getCrossTraditionAccess(characterFeats, characterTradition);

	if (!access.hasAccess) {
		return false;
	}

	// Check if this tradition is allowed
	if (!access.allowedTraditions.includes(spellTradition)) {
		return false;
	}

	// Check if cantrips only
	if (access.cantripsOnly && spellLevel !== 0) {
		return false;
	}

	return true;
}

/**
 * Get a user-friendly description of cross-tradition access
 */
export function getCrossTraditionDescription(
	characterFeats: Array<{ name: string }>,
	characterTradition: string | null
): string | null {
	const access = getCrossTraditionAccess(characterFeats, characterTradition);

	if (!access.hasAccess) {
		return null;
	}

	const traditionsText = access.allowedTraditions
		.map(t => t.charAt(0).toUpperCase() + t.slice(1))
		.join(', ');

	if (access.cantripsOnly) {
		return `Your feats allow you to view and prepare cantrips from ${traditionsText} traditions`;
	} else {
		return `Your feats allow you to view and add spells from ${traditionsText} traditions`;
	}
}

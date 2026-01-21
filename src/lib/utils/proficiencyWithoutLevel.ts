/**
 * Proficiency Without Level (PWL) Variant Rule
 *
 * Removes character level from proficiency bonuses, making low-level
 * threats remain relevant at higher levels and creating a flatter
 * power curve.
 *
 * Standard PF2e proficiency bonuses:
 * - Untrained: 0
 * - Trained: level + 2
 * - Expert: level + 4
 * - Master: level + 6
 * - Legendary: level + 8
 *
 * With PWL:
 * - Untrained: 0
 * - Trained: +2
 * - Expert: +4
 * - Master: +6
 * - Legendary: +8
 *
 * This affects: attacks, AC, saves, skills, perception, and all other
 * proficiency-based calculations.
 */

import type { ProficiencyRank } from '$lib/engine/models/Character';

/**
 * Calculate proficiency bonus with Proficiency Without Level variant
 *
 * @param rank The proficiency rank
 * @param level The character level (ignored in PWL)
 * @param usePWL Whether to use Proficiency Without Level variant
 * @returns The proficiency bonus
 */
export function getProficiencyBonus(
	rank: ProficiencyRank,
	level: number,
	usePWL: boolean = false
): number {
	if (usePWL) {
		// Proficiency Without Level: flat bonuses
		switch (rank) {
			case 'untrained':
				return 0;
			case 'trained':
				return 2;
			case 'expert':
				return 4;
			case 'master':
				return 6;
			case 'legendary':
				return 8;
		}
	} else {
		// Standard PF2e: level + rank bonus
		switch (rank) {
			case 'untrained':
				return 0;
			case 'trained':
				return level + 2;
			case 'expert':
				return level + 4;
			case 'master':
				return level + 6;
			case 'legendary':
				return level + 8;
		}
	}
}

/**
 * Calculate level-based DC adjustments for PWL
 *
 * When using PWL, DCs need to be adjusted down to account for
 * the lack of level in proficiency bonuses.
 *
 * Standard DC by level: 14 + level + adjustment
 * PWL DC by level: 14 + adjustment (no level)
 */
export function getDCByLevel(level: number, adjustment: number = 0, usePWL: boolean = false): number {
	if (usePWL) {
		return 14 + adjustment;
	} else {
		return 14 + level + adjustment;
	}
}

/**
 * Get the difference in power level when using PWL
 *
 * This is primarily for informational/UI purposes to show
 * how much the variant rule affects calculations.
 */
export function getPWLDifference(rank: ProficiencyRank, level: number): number {
	const standard = getProficiencyBonus(rank, level, false);
	const pwl = getProficiencyBonus(rank, level, true);
	return standard - pwl;
}

/**
 * Get spell attack and DC adjustments for PWL
 *
 * Spellcasting proficiency follows the same rules, but this
 * helper makes it explicit for spell calculations.
 */
export interface SpellcastingProficiency {
	attackBonus: number;
	dc: number;
}

/**
 * Calculate spell attack and DC with PWL
 *
 * @param rank Spellcasting proficiency rank
 * @param level Character level
 * @param abilityModifier Relevant ability modifier (Int, Wis, or Cha)
 * @param usePWL Whether to use Proficiency Without Level variant
 */
export function getSpellcastingProficiency(
	rank: ProficiencyRank,
	level: number,
	abilityModifier: number,
	usePWL: boolean = false
): SpellcastingProficiency {
	const profBonus = getProficiencyBonus(rank, level, usePWL);

	return {
		attackBonus: abilityModifier + profBonus,
		dc: 10 + abilityModifier + profBonus
	};
}

/**
 * Get a summary of how PWL affects proficiency at a given level
 */
export function getPWLSummary(level: number): string[] {
	const summary: string[] = [];

	const ranks: ProficiencyRank[] = ['trained', 'expert', 'master', 'legendary'];

	summary.push('Proficiency Without Level removes character level from proficiency bonuses:');
	summary.push('');

	for (const rank of ranks) {
		const standard = getProficiencyBonus(rank, level, false);
		const pwl = getProficiencyBonus(rank, level, true);
		const diff = standard - pwl;

		summary.push(`${rank.charAt(0).toUpperCase() + rank.slice(1)}: +${pwl} (was +${standard}, -${diff})`);
	}

	summary.push('');
	summary.push('This makes low-level challenges remain relevant at higher levels.');
	summary.push('DCs and monster statistics should be adjusted down accordingly.');

	return summary;
}

/**
 * Monster/challenge level adjustment guidance for PWL
 *
 * When using PWL, creatures and DCs should be adjusted to account
 * for PCs having lower bonuses. This provides guidelines.
 */
export interface PWLAdjustmentGuidance {
	/** How much to reduce monster level/DC */
	reduction: number;
	/** Explanation of the adjustment */
	explanation: string;
}

/**
 * Get adjustment guidance for a creature relative to party level
 */
export function getMonsterLevelAdjustment(
	monsterLevel: number,
	partyLevel: number
): PWLAdjustmentGuidance {
	const levelDifference = Math.abs(monsterLevel - partyLevel);

	if (levelDifference >= 5) {
		return {
			reduction: Math.floor(levelDifference / 2),
			explanation:
				'Reduce monster statistics by level difference to maintain intended challenge with PWL.'
		};
	} else if (levelDifference >= 3) {
		return {
			reduction: 1,
			explanation: 'Slight reduction to monster statistics to account for PWL.'
		};
	} else {
		return {
			reduction: 0,
			explanation: 'Monster is close enough in level that no adjustment is needed.'
		};
	}
}

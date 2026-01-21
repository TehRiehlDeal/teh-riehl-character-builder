/**
 * Heritage Rule Processor
 *
 * Parses Foundry VTT rule elements from heritage data and extracts
 * meaningful benefits for display and application to characters.
 *
 * Supported Rule Types (by priority):
 * - P0: FlatModifier, Sense, Strike, BaseSpeed, ActiveEffectLike, DamageDice, AdjustModifier
 * - P1: GrantItem, ChoiceSet
 *
 * Note: This processor works with raw Foundry VTT data that may contain
 * rule types not yet in the engine registry. We use a flexible type to
 * handle all rule variations found in heritage files.
 */

// Use a flexible type for raw Foundry rules that may not be in the engine yet
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RawFoundryRule = any;

/**
 * Parsed heritage benefits
 */
export interface HeritageRuleBenefits {
	/** Sensory abilities granted (darkvision, low-light vision, etc.) */
	senses: SenseBenefit[];
	/** Granted feats and features */
	grantedItems: GrantedItemBenefit[];
	/** Skill proficiency upgrades */
	skillProficiencies: SkillProficiencyBenefit[];
	/** Speed modifications */
	speeds: SpeedBenefit[];
	/** Unarmed strikes granted */
	strikes: StrikeBenefit[];
	/** Flat modifiers to stats */
	modifiers: ModifierBenefit[];
	/** Choices the player must make */
	choices: ChoiceBenefit[];
	/** Other rule types (for future implementation) */
	other: OtherRuleBenefit[];
}

export interface SenseBenefit {
	type: string; // darkvision, lowlight-vision, scent, etc.
	range?: number;
}

export interface GrantedItemBenefit {
	uuid: string; // Compendium UUID
	label?: string;
}

export interface SkillProficiencyBenefit {
	skill: string; // e.g., 'crafting', 'deception'
	rank: number; // 0 = untrained, 1 = trained, 2 = expert, 3 = master, 4 = legendary
	mode: 'upgrade' | 'override' | 'downgrade';
}

export interface SpeedBenefit {
	type: string; // land, swim, fly, climb, burrow
	value: number;
	predicate?: unknown[];
}

export interface StrikeBenefit {
	label: string;
	baseType?: string; // claw, fangs, horn, etc.
	damage: {
		dice: number;
		die: string; // d4, d6, d8, etc.
		type: string; // slashing, piercing, bludgeoning
	};
	traits: string[];
}

export interface ModifierBenefit {
	label: string;
	selector: string; // ac, deception, land-speed, etc.
	value: number | string; // Can be formula
	type?: string; // status, circumstance, item, untyped
	predicate?: unknown[];
}

export interface ChoiceBenefit {
	prompt: string;
	choices: Array<{ label: string; value: string }>;
	flag?: string; // Flag name to store choice
	rollOption?: string; // Roll option prefix
	config?: string; // Dynamic choice config (e.g., 'skills', 'languages')
	itemType?: string; // Item type for dynamic choices (e.g., 'feat')
	filter?: string[]; // Filters for item type choices
}

export interface OtherRuleBenefit {
	key: string;
	summary: string;
}

/**
 * Process heritage rules and extract benefits
 */
export function processHeritageRules(rules: RawFoundryRule[]): HeritageRuleBenefits {
	const benefits: HeritageRuleBenefits = {
		senses: [],
		grantedItems: [],
		skillProficiencies: [],
		speeds: [],
		strikes: [],
		modifiers: [],
		choices: [],
		other: []
	};

	for (const rule of rules) {
		try {
			switch (rule.key) {
				case 'Sense':
					processSense(rule, benefits);
					break;
				case 'GrantItem':
					processGrantItem(rule, benefits);
					break;
				case 'ActiveEffectLike':
					processActiveEffectLike(rule, benefits);
					break;
				case 'BaseSpeed':
					processBaseSpeed(rule, benefits);
					break;
				case 'Strike':
					processStrike(rule, benefits);
					break;
				case 'FlatModifier':
					processFlatModifier(rule, benefits);
					break;
				case 'ChoiceSet':
					processChoiceSet(rule, benefits);
					break;
				case 'DamageDice':
				case 'AdjustModifier':
				case 'ItemAlteration':
				case 'Resistance':
				case 'AdjustDegreeOfSuccess':
				case 'RollOption':
				case 'CreatureSize':
				case 'ActorTraits':
				case 'Note':
					// Track other rule types for future implementation
					processOtherRule(rule, benefits);
					break;
				default:
					// Unknown rule type - log for future investigation
					console.debug('Unknown heritage rule type:', rule.key);
			}
		} catch (error) {
			console.warn(`Failed to process heritage rule ${rule.key}:`, error);
		}
	}

	return benefits;
}

/**
 * Process Sense rule
 */
function processSense(rule: RawFoundryRule, benefits: HeritageRuleBenefits): void {
	benefits.senses.push({
		type: rule.selector || 'unknown',
		range: rule.range
	});
}

/**
 * Process GrantItem rule
 */
function processGrantItem(rule: RawFoundryRule, benefits: HeritageRuleBenefits): void {
	if (rule.uuid) {
		// Skip template references (e.g., {item|flags.pf2e.rulesSelections.versatileHeritage})
		// These are placeholders that will be filled by ChoiceSet selections
		if (typeof rule.uuid === 'string' && rule.uuid.includes('{item|flags')) {
			return;
		}

		benefits.grantedItems.push({
			uuid: rule.uuid,
			label: rule.label
		});
	}
}

/**
 * Process ActiveEffectLike rule
 */
function processActiveEffectLike(rule: RawFoundryRule, benefits: HeritageRuleBenefits): void {
	// Check if this is a skill proficiency upgrade
	if (rule.path && typeof rule.path === 'string' && rule.path.includes('system.skills.')) {
		const skillMatch = rule.path.match(/system\.skills\.([^.]+)\.rank/);
		if (skillMatch && rule.value !== undefined) {
			benefits.skillProficiencies.push({
				skill: skillMatch[1],
				rank: typeof rule.value === 'number' ? rule.value : parseInt(rule.value, 10),
				mode: rule.mode || 'upgrade'
			});
		}
	}
	// Other ActiveEffectLike rules are tracked as "other" for now
	else {
		benefits.other.push({
			key: 'ActiveEffectLike',
			summary: `Modifies ${rule.path}`
		});
	}
}

/**
 * Process BaseSpeed rule
 */
function processBaseSpeed(rule: RawFoundryRule, benefits: HeritageRuleBenefits): void {
	if (rule.selector && rule.value !== undefined) {
		benefits.speeds.push({
			type: rule.selector,
			value: typeof rule.value === 'number' ? rule.value : parseInt(rule.value, 10),
			predicate: rule.predicate
		});
	}
}

/**
 * Process Strike rule
 */
function processStrike(rule: RawFoundryRule, benefits: HeritageRuleBenefits): void {
	// Parse strike damage
	const damage = rule.damage?.base;
	if (damage) {
		benefits.strikes.push({
			label: rule.label || rule.baseType || 'unarmed strike',
			baseType: rule.baseType,
			damage: {
				dice: damage.dice || 1,
				die: damage.die || 'd4',
				type: damage.damageType || 'bludgeoning'
			},
			traits: rule.traits || []
		});
	}
}

/**
 * Process FlatModifier rule
 */
function processFlatModifier(rule: RawFoundryRule, benefits: HeritageRuleBenefits): void {
	if (rule.selector && rule.value !== undefined) {
		benefits.modifiers.push({
			label: rule.label || `${rule.selector} modifier`,
			selector: rule.selector,
			value: rule.value,
			type: rule.type,
			predicate: rule.predicate
		});
	}
}

/**
 * Process ChoiceSet rule
 */
function processChoiceSet(rule: RawFoundryRule, benefits: HeritageRuleBenefits): void {
	// Handle array-based choices (predefined list)
	if (rule.choices && Array.isArray(rule.choices)) {
		benefits.choices.push({
			prompt: rule.prompt || 'Make a choice',
			choices: rule.choices.map((choice: { label: string; value: string }) => ({
				label: choice.label,
				value: choice.value
			})),
			flag: rule.flag,
			rollOption: rule.rollOption
		});
	}
	// Handle config-based choices (dynamic generation like skills or languages)
	else if (rule.choices && rule.choices.config) {
		const config = rule.choices.config;
		let choiceList: Array<{ label: string; value: string }> = [];

		// Generate choice list based on config type
		if (config === 'skills') {
			// All PF2e skills
			const skills = [
				'acrobatics',
				'arcana',
				'athletics',
				'crafting',
				'deception',
				'diplomacy',
				'intimidation',
				'medicine',
				'nature',
				'occultism',
				'performance',
				'religion',
				'society',
				'stealth',
				'survival',
				'thievery'
			];
			choiceList = skills.map((skill) => ({
				label: skill.charAt(0).toUpperCase() + skill.slice(1),
				value: skill
			}));
		}

		benefits.choices.push({
			prompt: rule.prompt || 'Make a choice',
			choices: choiceList,
			flag: rule.flag,
			rollOption: rule.rollOption,
			config
		});
	}
	// Handle itemType-based choices (dynamic item selection like feats)
	else if (rule.choices && rule.choices.itemType) {
		benefits.choices.push({
			prompt: rule.prompt || 'Make a choice',
			choices: [], // Will be populated dynamically in UI
			flag: rule.flag,
			rollOption: rule.rollOption,
			itemType: rule.choices.itemType,
			filter: rule.choices.filter || []
		});
	}
}

/**
 * Process other rule types
 */
function processOtherRule(rule: RawFoundryRule, benefits: HeritageRuleBenefits): void {
	let summary = rule.key;

	// Add context for specific rule types
	switch (rule.key) {
		case 'Resistance':
			summary = `${rule.type || 'unknown'} resistance ${rule.value || ''}`;
			break;
		case 'CreatureSize':
			summary = `Size: ${rule.value || 'unknown'}`;
			break;
		case 'RollOption':
			summary = `Option: ${rule.option || 'unknown'}`;
			break;
		case 'ActorTraits':
			summary = `Adds trait: ${rule.add ? rule.add.join(', ') : 'unknown'}`;
			break;
		case 'ItemAlteration':
			summary = `Modifies item: ${rule.property || 'unknown'}`;
			break;
		case 'AdjustDegreeOfSuccess':
			summary = `Adjusts success degree for ${rule.selector || 'unknown'}`;
			break;
		case 'Note':
			summary = `Note: ${rule.title || rule.text || 'information'}`;
			break;
		default:
			summary = rule.key;
	}

	benefits.other.push({
		key: rule.key,
		summary
	});
}

/**
 * Format sense type for display
 */
export function formatSenseType(type: string): string {
	const senseNames: Record<string, string> = {
		darkvision: 'Darkvision',
		'lowlight-vision': 'Low-Light Vision',
		'low-light-vision': 'Low-Light Vision',
		scent: 'Scent',
		blindsense: 'Blindsense',
		tremorsense: 'Tremorsense',
		echolocation: 'Echolocation'
	};
	return senseNames[type] || type.charAt(0).toUpperCase() + type.slice(1);
}

/**
 * Format skill name for display
 */
export function formatSkillName(skill: string): string {
	// Convert 'deception' → 'Deception'
	return skill.charAt(0).toUpperCase() + skill.slice(1);
}

/**
 * Format proficiency rank for display
 */
export function formatProficiencyRank(rank: number): string {
	const ranks = ['Untrained', 'Trained', 'Expert', 'Master', 'Legendary'];
	return ranks[rank] || 'Unknown';
}

/**
 * Format speed type for display
 */
export function formatSpeedType(type: string): string {
	const speedNames: Record<string, string> = {
		land: 'Land Speed',
		swim: 'Swim Speed',
		fly: 'Fly Speed',
		climb: 'Climb Speed',
		burrow: 'Burrow Speed'
	};
	return speedNames[type] || type.charAt(0).toUpperCase() + type.slice(1);
}

/**
 * Extract item name from Compendium UUID
 */
export function extractItemNameFromUUID(uuid: string): string {
	// UUID format: Compendium.pf2e.feats-srd.Item.Adopted Ancestry
	const parts = uuid.split('.');
	return parts[parts.length - 1] || 'Unknown Item';
}

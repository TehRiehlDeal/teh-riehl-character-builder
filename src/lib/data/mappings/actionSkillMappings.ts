/**
 * Action to Skill Mappings
 *
 * Maps action names to their governing skills.
 * - Basic actions have no skill requirement: []
 * - Skill actions map to one or more skills
 * - Multi-skill actions allow proficiency in ANY listed skill
 *
 * These mappings are based on the Pathfinder 2e Core Rulebook.
 */

/**
 * Maps action names to their governing skills.
 * Empty array = no skill requirement (basic action)
 * Multiple skills = proficiency in ANY listed skill qualifies
 */
export const ACTION_SKILL_MAP: Record<string, string[]> = {
	// === BASIC ACTIONS (26) - No skill requirement ===
	'Arrest a Fall': [],
	'Avert Gaze': [],
	Burrow: [],
	'Catch a Falling Creature': [],
	Crawl: [],
	Dismiss: [],
	'Drop Prone': [],
	Escape: [],
	Fly: [],
	'Grab an Edge': [],
	'High Jump': [],
	Interact: [],
	Leap: [],
	'Long Jump': [],
	Mount: [],
	'Point Out': [],
	'Raise a Shield': [],
	Ready: [],
	Release: [],
	Seek: [],
	Stand: [],
	Step: [],
	Stride: [],
	'Take Cover': [],
	'Sense Direction': [],
	Aid: [],

	// === ACROBATICS (4) ===
	Balance: ['acrobatics'],
	'Maneuver in Flight': ['acrobatics'],
	Squeeze: ['acrobatics'],
	'Tumble Through': ['acrobatics'],

	// === ARCANA (3) ===
	'Identify Magic': ['arcana'],
	'Learn a Spell': ['arcana', 'nature', 'occultism', 'religion'],
	'Recall Knowledge': ['arcana', 'crafting', 'lore', 'nature', 'occultism', 'religion', 'society'],

	// === ATHLETICS (6) ===
	Climb: ['athletics'],
	Disarm: ['athletics'],
	'Force Open': ['athletics'],
	Grapple: ['athletics'],
	Shove: ['athletics'],
	Swim: ['athletics'],
	Trip: ['athletics'],

	// === CRAFTING (4) ===
	Craft: ['crafting'],
	'Identify Alchemy': ['crafting'],
	Repair: ['crafting'],
	'Earn Income': ['crafting', 'lore', 'performance'],

	// === DECEPTION (4) ===
	'Create a Diversion': ['deception'],
	Feint: ['deception'],
	Impersonate: ['deception'],
	Lie: ['deception'],

	// === DIPLOMACY (3) ===
	'Gather Information': ['diplomacy'],
	'Make an Impression': ['diplomacy'],
	Request: ['diplomacy'],

	// === INTIMIDATION (2) ===
	Coerce: ['intimidation'],
	Demoralize: ['intimidation'],

	// === MEDICINE (4) ===
	'Administer First Aid': ['medicine'],
	'Treat Disease': ['medicine'],
	'Treat Poison': ['medicine'],
	'Treat Wounds': ['medicine'],

	// === NATURE (1) ===
	'Command an Animal': ['nature'],

	// === OCCULTISM (1) ===
	'Decipher Writing': ['arcana', 'occultism', 'religion', 'society'],

	// === PERFORMANCE (1) ===
	Perform: ['performance'],

	// === SOCIETY (2) ===
	'Create Forgery': ['society'],
	Subsist: ['society', 'survival'],

	// === STEALTH (4) ===
	'Conceal an Object': ['stealth'],
	Hide: ['stealth'],
	Sneak: ['stealth'],
	'Palm an Object': ['stealth'],

	// === SURVIVAL (3) ===
	'Cover Tracks': ['survival'],
	Track: ['survival'],

	// === THIEVERY (3) ===
	'Disable Device': ['thievery'],
	'Pick a Lock': ['thievery'],
	Steal: ['thievery']
};

/**
 * Get the skills required for an action by name or ID
 * @returns Array of skill names (empty if basic action)
 */
export function getActionSkills(actionIdOrName: string): string[] {
	// First try direct name lookup
	if (ACTION_SKILL_MAP[actionIdOrName]) {
		return ACTION_SKILL_MAP[actionIdOrName];
	}
	// Return empty array if not found (assume basic action)
	return [];
}

/**
 * Check if an action is in our curated list (either basic or skill)
 */
export function isCoreAction(actionName: string): boolean {
	return actionName in ACTION_SKILL_MAP;
}

/**
 * Check if an action is a basic action (no skill requirement)
 */
export function isBasicAction(actionIdOrName: string): boolean {
	if (!isCoreAction(actionIdOrName)) return false;
	const skills = getActionSkills(actionIdOrName);
	return skills.length === 0;
}

/**
 * Check if an action is a skill action
 */
export function isSkillAction(actionIdOrName: string): boolean {
	if (!isCoreAction(actionIdOrName)) return false;
	const skills = getActionSkills(actionIdOrName);
	return skills.length > 0;
}

/**
 * Get all skill names used in skill actions
 */
export function getAllSkills(): string[] {
	const skills = new Set<string>();
	Object.values(ACTION_SKILL_MAP).forEach((skillArray) => {
		skillArray.forEach((skill) => skills.add(skill));
	});
	return Array.from(skills).sort();
}

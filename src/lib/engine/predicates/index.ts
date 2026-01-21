/**
 * Predicate System
 *
 * Predicates are conditional statements that determine whether a rule element or modifier
 * should be applied. They check for the presence of roll options, effects, traits, etc.
 *
 * Examples:
 * - "self:effect:rage" - Character has the Rage effect active
 * - "target:trait:undead" - Target has the undead trait
 * - "item:tag:magical" - Item has the magical tag
 * - "self:level:gte:5" - Character is level 5 or higher
 */

/**
 * Predicate statement - can be a string or an object with more complex conditions
 */
export type PredicateStatement = string | PredicateObject;

/**
 * Complex predicate with AND/OR/NOT logic
 */
export interface PredicateObject {
	and?: PredicateStatement[];
	or?: PredicateStatement[];
	not?: PredicateStatement;
}

/**
 * Roll options available for predicate evaluation
 * Roll options are flags set by various sources (effects, stances, conditions, etc.)
 */
export type RollOptions = Set<string>;

/**
 * Context for predicate evaluation
 */
export interface PredicateContext {
	/** Available roll options */
	options: RollOptions;

	/** Character level (for level-based predicates) */
	level?: number;

	/** Character traits */
	traits?: string[];

	/** Active effects */
	effects?: string[];

	/** Additional custom data */
	[key: string]: unknown;
}

/**
 * Evaluate a predicate against a context
 *
 * @param predicate - The predicate to evaluate (array of statements)
 * @param context - The context to evaluate against
 * @returns true if all predicate statements are true (AND logic)
 */
export function evaluatePredicate(
	predicate: PredicateStatement[] | undefined,
	context: PredicateContext
): boolean {
	// No predicate means always true
	if (!predicate || predicate.length === 0) {
		return true;
	}

	// All statements must be true (implicit AND)
	return predicate.every((statement) => evaluateStatement(statement, context));
}

/**
 * Evaluate a single predicate statement
 */
function evaluateStatement(statement: PredicateStatement, context: PredicateContext): boolean {
	// Handle complex predicate objects
	if (typeof statement === 'object') {
		return evaluatePredicateObject(statement, context);
	}

	// Handle string statements
	return evaluateStringStatement(statement, context);
}

/**
 * Evaluate a complex predicate object with AND/OR/NOT logic
 */
function evaluatePredicateObject(predicate: PredicateObject, context: PredicateContext): boolean {
	// Handle NOT
	if (predicate.not) {
		return !evaluateStatement(predicate.not, context);
	}

	// Handle AND
	if (predicate.and) {
		return predicate.and.every((stmt) => evaluateStatement(stmt, context));
	}

	// Handle OR
	if (predicate.or) {
		return predicate.or.some((stmt) => evaluateStatement(stmt, context));
	}

	// Empty object is true
	return true;
}

/**
 * Evaluate a string statement
 *
 * Supported formats:
 * - "roll-option-name" - Check if roll option exists
 * - "self:effect:name" - Check if effect is active
 * - "self:trait:name" - Check if character has trait
 * - "self:level:gte:5" - Check if level >= 5
 * - "self:level:lte:10" - Check if level <= 10
 * - "self:level:5" - Check if level == 5
 */
function evaluateStringStatement(statement: string, context: PredicateContext): boolean {
	// Check if it's a roll option
	if (context.options.has(statement)) {
		return true;
	}

	// Parse structured statements
	const parts = statement.split(':');

	// Handle effect checks: "self:effect:rage"
	if (parts[0] === 'self' && parts[1] === 'effect' && parts[2]) {
		return context.effects?.includes(parts[2]) ?? false;
	}

	// Handle trait checks: "self:trait:undead"
	if (parts[0] === 'self' && parts[1] === 'trait' && parts[2]) {
		return context.traits?.includes(parts[2]) ?? false;
	}

	// Handle level comparisons: "self:level:gte:5"
	if (parts[0] === 'self' && parts[1] === 'level' && context.level !== undefined) {
		if (parts[2] === 'gte' && parts[3]) {
			return context.level >= parseInt(parts[3], 10);
		}
		if (parts[2] === 'lte' && parts[3]) {
			return context.level <= parseInt(parts[3], 10);
		}
		if (parts[2] === 'gt' && parts[3]) {
			return context.level > parseInt(parts[3], 10);
		}
		if (parts[2] === 'lt' && parts[3]) {
			return context.level < parseInt(parts[3], 10);
		}
		// Exact level: "self:level:5"
		if (parts[2] && !parts[3]) {
			return context.level === parseInt(parts[2], 10);
		}
	}

	// Statement not found or not matched
	return false;
}

/**
 * Create a predicate context from character data
 */
export function createPredicateContext(data: {
	options?: RollOptions | string[];
	level?: number;
	traits?: string[];
	effects?: string[];
}): PredicateContext {
	return {
		options: data.options instanceof Set ? data.options : new Set(data.options ?? []),
		level: data.level,
		traits: data.traits,
		effects: data.effects
	};
}

/**
 * Add a roll option to a context
 */
export function addRollOption(context: PredicateContext, option: string): void {
	context.options.add(option);
}

/**
 * Remove a roll option from a context
 */
export function removeRollOption(context: PredicateContext, option: string): void {
	context.options.delete(option);
}

/**
 * Check if a roll option exists in a context
 */
export function hasRollOption(context: PredicateContext, option: string): boolean {
	return context.options.has(option);
}

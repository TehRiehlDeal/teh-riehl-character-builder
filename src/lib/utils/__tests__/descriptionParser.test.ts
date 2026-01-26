/**
 * Tests for Description Parser
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
	parseUUIDReferences,
	parseEmbedReferences,
	parseInlineRolls,
	parseTemplates,
	parseDamage,
	parseFoundryDamage,
	processDescription,
	stripHTML,
	getExcerpt
} from '../descriptionParser';

describe('Description Parser', () => {
	describe('parseUUIDReferences()', () => {
		it('should return empty string for empty input', () => {
			expect(parseUUIDReferences('')).toBe('');
		});

		it('should parse journal entry references with display text', () => {
			const input = '@UUID[Compendium.pf2e.journals.JournalEntry.abc123.JournalEntryPage.def456]{Rules of the Game}';
			const result = parseUUIDReferences(input);

			expect(result).toContain('class="journal-link"');
			expect(result).toContain('data-journal-id="abc123"');
			expect(result).toContain('data-page-id="def456"');
			expect(result).toContain('>Rules of the Game<');
		});

		it('should parse item references without display text', () => {
			const input = '@UUID[Compendium.pf2e.feats-srd.Item.Diehard]';
			const result = parseUUIDReferences(input);

			expect(result).toContain('class="uuid-link"');
			expect(result).toContain('data-compendium="feats-srd"');
			expect(result).toContain('data-item="Diehard"');
			expect(result).toContain('>Diehard<');
		});

		it('should parse item references with display text', () => {
			const input = '@UUID[Compendium.pf2e.spells-srd.Item.Fireball]{Fireball Spell}';
			const result = parseUUIDReferences(input);

			expect(result).toContain('class="uuid-link"');
			expect(result).toContain('data-compendium="spells-srd"');
			expect(result).toContain('data-item="Fireball"');
			expect(result).toContain('>Fireball Spell<');
		});

		it('should format item names with dashes and underscores', () => {
			const input = '@UUID[Compendium.pf2e.feats-srd.Item.power-attack]';
			const result = parseUUIDReferences(input);

			expect(result).toContain('>Power Attack<');
		});

		it('should handle multiple references in same text', () => {
			const input = 'You can use @UUID[Compendium.pf2e.feats-srd.Item.Diehard] or @UUID[Compendium.pf2e.feats-srd.Item.ToughIt]{Tough It}';
			const result = parseUUIDReferences(input);

			expect(result).toContain('>Diehard<');
			expect(result).toContain('>Tough It<');
		});

		it('should preserve surrounding text', () => {
			const input = 'Before @UUID[Compendium.pf2e.feats-srd.Item.Diehard] After';
			const result = parseUUIDReferences(input);

			expect(result).toMatch(/^Before .* After$/);
		});

		it('should handle item names with periods', () => {
			const input = '@UUID[Compendium.pf2e.classfeatures.Item.Rage.Instinct]';
			const result = parseUUIDReferences(input);

			// Should use the last part after splitting by period
			expect(result).toContain('>Instinct<');
		});
	});

	describe('parseEmbedReferences()', () => {
		it('should return empty string for empty input', () => {
			expect(parseEmbedReferences('')).toBe('');
		});

		it('should parse embed references', () => {
			const input = '@Embed[Compendium.pf2e.feats-srd.Item.abc123]';
			const result = parseEmbedReferences(input);

			expect(result).toContain('class="embed-placeholder"');
			expect(result).toContain('data-compendium="feats-srd"');
			expect(result).toContain('data-item-id="abc123"');
		});

		it('should parse embed references with inline flag', () => {
			const input = '@Embed[Compendium.pf2e.feats-srd.Item.abc123 inline]';
			const result = parseEmbedReferences(input);

			expect(result).toContain('class="embed-placeholder"');
		});

		it('should handle multiple embeds', () => {
			const input = '@Embed[Compendium.pf2e.feats-srd.Item.abc] and @Embed[Compendium.pf2e.spells-srd.Item.def]';
			const result = parseEmbedReferences(input);

			expect(result).toContain('data-item-id="abc"');
			expect(result).toContain('data-item-id="def"');
		});
	});

	describe('parseInlineRolls()', () => {
		it('should return empty string for empty input', () => {
			expect(parseInlineRolls('')).toBe('');
		});

		it('should parse inline roll syntax', () => {
			const input = '[[/r 1d20+5]]';
			const result = parseInlineRolls(input);

			expect(result).toContain('class="inline-roll"');
			expect(result).toContain('data-roll="1d20+5"');
			expect(result).toContain('>1d20+5<');
		});

		it('should parse Check syntax', () => {
			const input = '@Check[fortitude:15:disease]';
			const result = parseInlineRolls(input);

			expect(result).toContain('class="inline-check"');
			expect(result).toContain('data-check="fortitude:15:disease"');
			expect(result).toContain('>FORTITUDE DC 15<');
		});

		it('should parse Check without traits', () => {
			const input = '@Check[reflex:20]';
			const result = parseInlineRolls(input);

			expect(result).toContain('>REFLEX DC 20<');
		});

		it('should handle multiple rolls', () => {
			const input = '[[/r 1d20]] and [[/r 2d6]]';
			const result = parseInlineRolls(input);

			expect(result).toContain('data-roll="1d20"');
			expect(result).toContain('data-roll="2d6"');
		});
	});

	describe('parseTemplates()', () => {
		it('should return empty string for empty input', () => {
			expect(parseTemplates('')).toBe('');
		});

		it('should parse template references', () => {
			const input = '@Template[cone:30]';
			const result = parseTemplates(input);

			expect(result).toContain('class="template-ref"');
			expect(result).toContain('30-foot cone');
		});

		it('should parse burst template', () => {
			const input = '@Template[burst:20]';
			const result = parseTemplates(input);

			expect(result).toContain('20-foot burst');
		});

		it('should parse line template', () => {
			const input = '@Template[line:60]';
			const result = parseTemplates(input);

			expect(result).toContain('60-foot line');
		});

		it('should handle multiple templates', () => {
			const input = '@Template[cone:15] or @Template[burst:10]';
			const result = parseTemplates(input);

			expect(result).toContain('15-foot cone');
			expect(result).toContain('10-foot burst');
		});
	});

	describe('parseDamage()', () => {
		it('should return empty string for empty input', () => {
			expect(parseDamage('')).toBe('');
		});

		it('should parse damage in curly braces', () => {
			const input = '{1d6}';
			const result = parseDamage(input);

			expect(result).toContain('class="damage"');
			expect(result).toContain('>1d6<');
		});

		it('should parse damage with type', () => {
			const input = '{2d8 fire}';
			const result = parseDamage(input);

			expect(result).toContain('>2d8 fire<');
		});

		it('should handle multiple damage instances', () => {
			const input = '{1d6} slashing and {1d4} fire';
			const result = parseDamage(input);

			const matches = result.match(/class="damage"/g);
			expect(matches).toHaveLength(2);
		});
	});

	describe('parseFoundryDamage()', () => {
		it('should return empty string for empty input', () => {
			expect(parseFoundryDamage('')).toBe('');
		});

		it('should parse simple damage formula', () => {
			const input = '@Damage[2d6]';
			const result = parseFoundryDamage(input);

			expect(result).toContain('class="inline-damage"');
			expect(result).toContain('data-formula="2d6"');
			expect(result).toContain('>2d6 damage<');
		});

		it('should parse damage with type', () => {
			const input = '@Damage[2d6[fire]]';
			const result = parseFoundryDamage(input);

			expect(result).toContain('data-types="fire"');
			expect(result).toContain('>2d6 fire damage<');
		});

		it('should parse damage with multiple types', () => {
			const input = '@Damage[1d4[persistent,fire]]';
			const result = parseFoundryDamage(input);

			expect(result).toContain('data-types="persistent,fire"');
			expect(result).toContain('>1d4 persistent fire damage<');
		});

		it('should handle healing type specially', () => {
			const input = '@Damage[2d8[healing]]';
			const result = parseFoundryDamage(input);

			expect(result).toContain('class="inline-healing"');
			expect(result).not.toContain(' damage<');
		});

		it('should evaluate formula with spell level context', () => {
			const input = '@Damage[@item.level]';
			const result = parseFoundryDamage(input, { spellLevel: 3 });

			expect(result).toContain('>3 damage<');
		});

		it('should evaluate formula with ceil function', () => {
			const input = '@Damage[(ceil(@item.level/2))d6]';
			const result = parseFoundryDamage(input, { spellLevel: 5 });

			expect(result).toContain('>3d6 damage<');
		});

		it('should handle nested brackets correctly', () => {
			const input = '@Damage[(ceil(@item.level/2))[persistent,acid]]';
			const result = parseFoundryDamage(input, { spellLevel: 5 });

			expect(result).toContain('3');
			expect(result).toContain('persistent');
			expect(result).toContain('acid');
		});

		it('should simplify formula without context', () => {
			const input = '@Damage[@item.level]';
			const result = parseFoundryDamage(input);

			expect(result).toContain('spell rank');
		});

		it('should handle multiple damage instances', () => {
			const input = '@Damage[1d6[fire]] and @Damage[1d4[cold]]';
			const result = parseFoundryDamage(input);

			expect(result).toContain('1d6 fire damage');
			expect(result).toContain('1d4 cold damage');
		});
	});

	describe('processDescription()', () => {
		it('should return empty string for empty input', () => {
			expect(processDescription('')).toBe('');
		});

		it('should apply all transformations in order', () => {
			const input = 'Cast @UUID[Compendium.pf2e.spells-srd.Item.Fireball] to deal @Damage[8d6[fire]]';
			const result = processDescription(input);

			expect(result).toContain('class="uuid-link"');
			expect(result).toContain('class="inline-damage"');
		});

		it('should handle complex descriptions', () => {
			const input = '@Embed[Compendium.pf2e.feats-srd.Item.test] Make a @Check[reflex:15] or take @Damage[2d6[fire]]';
			const result = processDescription(input);

			expect(result).toContain('embed-placeholder');
			expect(result).toContain('inline-check');
			expect(result).toContain('inline-damage');
		});

		it('should pass context to damage parser', () => {
			const input = '@Damage[(@item.level)d6]';
			const result = processDescription(input, { spellLevel: 3 });

			expect(result).toContain('3d6');
		});

		it('should parse templates', () => {
			const input = 'Creates a @Template[cone:30]';
			const result = processDescription(input);

			expect(result).toContain('30-foot cone');
		});

		it('should parse inline rolls', () => {
			const input = 'Roll [[/r 1d20+5]] for attack';
			const result = processDescription(input);

			expect(result).toContain('class="inline-roll"');
		});
	});

	describe('stripHTML()', () => {
		// Mock document.createElement for jsdom
		beforeEach(() => {
			global.document = {
				createElement: (tag: string) => {
					if (tag === 'textarea') {
						return {
							innerHTML: '',
							get value() {
								// Simple HTML entity decoder for tests
								return this.innerHTML
									.replace(/&lt;/g, '<')
									.replace(/&gt;/g, '>')
									.replace(/&amp;/g, '&')
									.replace(/&quot;/g, '"')
									.replace(/&#39;/g, "'");
							},
							set value(val: string) {
								this.innerHTML = val;
							}
						};
					}
					return {};
				}
			} as any;
		});

		it('should return empty string for empty input', () => {
			expect(stripHTML('')).toBe('');
		});

		it('should remove HTML tags', () => {
			const input = '<p>Hello <strong>world</strong></p>';
			const result = stripHTML(input);

			expect(result).toBe('Hello world');
		});

		it('should remove @Embed references', () => {
			const input = '@Embed[Compendium.pf2e.feats-srd.Item.test] text';
			const result = stripHTML(input);

			expect(result).toBe(' text');
		});

		it('should extract display text from UUID with braces', () => {
			const input = '@UUID[Compendium.pf2e.feats-srd.Item.Diehard]{Custom Name}';
			const result = stripHTML(input);

			expect(result).toBe('Custom Name');
		});

		it('should extract item name from UUID without braces', () => {
			const input = '@UUID[Compendium.pf2e.feats-srd.Item.Power Attack]';
			const result = stripHTML(input);

			expect(result).toBe('Power Attack');
		});

		it('should handle item names with dashes', () => {
			const input = '@UUID[Compendium.pf2e.feats-srd.Item.power-attack]';
			const result = stripHTML(input);

			expect(result).toBe('power attack');
		});

		it('should remove @Damage references', () => {
			const input = 'Deal @Damage[2d6] to targets';
			const result = stripHTML(input);

			expect(result).toBe('Deal  to targets');
		});

		it('should remove @Check references', () => {
			const input = 'Make a @Check[reflex:15] save';
			const result = stripHTML(input);

			expect(result).toBe('Make a  save');
		});

		it('should remove @Template references', () => {
			const input = 'Creates a @Template[cone:30] area';
			const result = stripHTML(input);

			expect(result).toBe('Creates a  area');
		});

		it('should handle complex HTML with all features', () => {
			const input = '<p>Cast @UUID[Compendium.pf2e.spells-srd.Item.Fireball] to deal @Damage[8d6] in a @Template[burst:20]</p>';
			const result = stripHTML(input);

			expect(result).toBe('Cast Fireball to deal  in a ');
		});
	});

	describe('getExcerpt()', () => {
		// Mock document.createElement for stripHTML
		beforeEach(() => {
			global.document = {
				createElement: (tag: string) => {
					if (tag === 'textarea') {
						return {
							innerHTML: '',
							get value() {
								return this.innerHTML;
							},
							set value(val: string) {
								this.innerHTML = val;
							}
						};
					}
					return {};
				}
			} as any;
		});

		it('should return full text when shorter than max length', () => {
			const input = '<p>Short text</p>';
			const result = getExcerpt(input, 120);

			expect(result).toBe('Short text');
		});

		it('should truncate long text', () => {
			const longText = '<p>' + 'a'.repeat(200) + '</p>';
			const result = getExcerpt(longText, 50);

			expect(result.length).toBeLessThanOrEqual(53); // 50 + '...'
			expect(result).toMatch(/\.\.\.$/);
		});

		it('should use default max length of 120', () => {
			const longText = '<p>' + 'a'.repeat(200) + '</p>';
			const result = getExcerpt(longText);

			expect(result.length).toBeLessThanOrEqual(123);
		});

		it('should strip HTML before truncating', () => {
			const input = '<p><strong>Text</strong> with <em>formatting</em> ' + 'x'.repeat(200) + '</p>';
			const result = getExcerpt(input, 30);

			expect(result).not.toContain('<');
			expect(result).not.toContain('>');
		});

		it('should handle empty input', () => {
			expect(getExcerpt('')).toBe('');
		});
	});
});

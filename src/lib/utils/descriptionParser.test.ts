import { describe, it, expect } from 'vitest';
import { parseUUIDReferences, processDescription } from './descriptionParser';

describe('parseUUIDReferences', () => {
	it('should parse journal entry UUIDs with display text', () => {
		const input = '<p>@UUID[Compendium.pf2e.journals.JournalEntry.45SK8rdbbxvEHfMn.JournalEntryPage.7pU8yM7yPMw92SY3]{Human}</p>';
		const output = parseUUIDReferences(input);

		expect(output).toContain('<a href="#"');
		expect(output).toContain('class="journal-link"');
		expect(output).toContain('>Human</a>');
		expect(output).toContain('data-journal-id="45SK8rdbbxvEHfMn"');
		expect(output).toContain('data-page-id="7pU8yM7yPMw92SY3"');
	});

	it('should parse item UUIDs without display text', () => {
		const input = '@UUID[Compendium.pf2e.feats-srd.Item.Diehard]';
		const output = parseUUIDReferences(input);

		expect(output).toContain('<a href=');
		expect(output).toContain('class="uuid-link"');
		expect(output).toContain('>Diehard</a>'); // Check visible text
		expect(output).toContain('data-uuid="@UUID[Compendium.pf2e.feats-srd.Item.Diehard]"'); // Clean UUID in data attribute
	});

	it('should parse item UUIDs with display text', () => {
		const input = '@UUID[Compendium.pf2e.feats-srd.Item.Diehard]{Die Hard Feat}';
		const output = parseUUIDReferences(input);

		expect(output).toContain('<a href=');
		expect(output).toContain('class="uuid-link"');
		expect(output).toContain('>Die Hard Feat</a>'); // Check visible text
		expect(output).not.toMatch(/>.*Diehard.*</); // Original name should not be in visible text
	});

	it('should handle multiple UUIDs in the same text', () => {
		const input = '<p>See @UUID[Compendium.pf2e.feats-srd.Item.Diehard] and @UUID[Compendium.pf2e.journals.JournalEntry.xyz.JournalEntryPage.abc]{Human} for details.</p>';
		const output = parseUUIDReferences(input);

		expect(output).toContain('uuid-link');
		expect(output).toContain('journal-link');
		expect(output).toContain('>Diehard</a>');
		expect(output).toContain('>Human</a>');
		// The @UUID text should not appear outside of data attributes
		const visibleText = output.replace(/data-[^=]*="[^"]*"/g, '');
		expect(visibleText).not.toContain('@UUID');
	});

	it('should handle text without UUIDs', () => {
		const input = '<p>This is just plain text with no links.</p>';
		const output = parseUUIDReferences(input);

		expect(output).toBe(input);
	});

	it('should map compendium types to routes correctly', () => {
		const input = '@UUID[Compendium.pf2e.spells-srd.Item.Fireball]';
		const output = parseUUIDReferences(input);

		expect(output).toContain('href="/spells/');
	});

	it('should handle condition items with display text containing numbers', () => {
		const input = '@UUID[Compendium.pf2e.conditionitems.Item.Wounded]{Wounded 1}';
		const output = parseUUIDReferences(input);

		expect(output).toContain('class="uuid-link"');
		expect(output).toContain('>Wounded 1</a>'); // Display text with number should appear correctly
		expect(output).toContain('data-uuid="@UUID[Compendium.pf2e.conditionitems.Item.Wounded]"'); // Clean UUID without display text
		expect(output).toContain('data-compendium="conditionitems"');
		expect(output).toContain('data-item="Wounded"');
		// Ensure no HTML attributes leak into visible text
		expect(output).not.toMatch(/Wounded 1"[^<]*data-compendium/);
	});
});

describe('processDescription', () => {
	it('should apply all transformations', () => {
		const input = '<p>@UUID[Compendium.pf2e.journals.JournalEntry.xyz.JournalEntryPage.abc]{Elf} and @Check[athletics:15]</p>';
		const output = processDescription(input);

		expect(output).toContain('journal-link');
		expect(output).toContain('>Elf</a>');
		expect(output).toContain('inline-check');
		expect(output).toContain('DC 15');
		const visibleText = output.replace(/data-[^=]*="[^"]*"/g, '');
		expect(visibleText).not.toContain('@UUID');
		expect(output).not.toContain('@Check');
	});
});

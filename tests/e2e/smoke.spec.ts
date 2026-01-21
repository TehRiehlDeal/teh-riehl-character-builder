import { test, expect } from '@playwright/test';

/**
 * Smoke Tests
 *
 * Quick verification that the application loads and basic functionality works.
 * These tests should be fast and catch major regressions.
 */

test.describe('Smoke Tests', () => {
	test('homepage should load', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		// Check that the page has a heading
		const heading = page.locator('h1, h2').first();
		await expect(heading).toBeVisible();
	});

	test('character builder page should load', async ({ page }) => {
		await page.goto('/builder/general');
		await page.waitForLoadState('networkidle');

		// Check that the page loaded
		const heading = page.locator('h1, h2').first();
		await expect(heading).toBeVisible();

		// Check that at least one section is visible
		const sections = page.locator('section, .content-section, [role="region"]');
		await expect(sections.first()).toBeVisible();
	});

	test('navigation should work', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		// Check if there are navigation links
		const links = page.locator('a[href^="/"]');
		const count = await links.count();
		expect(count).toBeGreaterThan(0);
	});

	test('legal page should load', async ({ page }) => {
		await page.goto('/legal');
		await page.waitForLoadState('networkidle');

		// Should have ORC license information
		await expect(page.locator('text=/ORC|license/i').first()).toBeVisible();
	});

	test('service worker should be registered', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		// Wait a moment for service worker registration
		await page.waitForTimeout(2000);

		// Check if service worker was registered
		const swRegistered = await page.evaluate(async () => {
			if ('serviceWorker' in navigator) {
				const registrations = await navigator.serviceWorker.getRegistrations();
				return registrations.length > 0;
			}
			return false;
		});

		// Service worker should be registered (PWA)
		expect(swRegistered).toBeTruthy();
	});

	test('localStorage should be available', async ({ page, context }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		// Test localStorage functionality
		await page.evaluate(() => {
			localStorage.setItem('test-key', 'test-value');
		});

		const value = await page.evaluate(() => {
			return localStorage.getItem('test-key');
		});

		expect(value).toBe('test-value');

		// Cleanup
		await page.evaluate(() => {
			localStorage.removeItem('test-key');
		});
	});

	test('console should not have errors', async ({ page }) => {
		const errors: string[] = [];

		page.on('console', (msg) => {
			if (msg.type() === 'error') {
				errors.push(msg.text());
			}
		});

		page.on('pageerror', (error) => {
			errors.push(error.message);
		});

		await page.goto('/');
		await page.waitForLoadState('networkidle');

		// Navigate to a couple pages
		await page.goto('/builder/general');
		await page.waitForLoadState('networkidle');

		// Should have no console errors
		expect(errors.filter(e => !e.includes('[vite]') && !e.includes('Svelte'))).toHaveLength(0);
	});
});

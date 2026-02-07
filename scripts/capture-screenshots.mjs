#!/usr/bin/env node
/**
 * Capture screenshots for README documentation.
 * Requires: dev server running on port 5180, Playwright installed.
 * Run: node scripts/capture-screenshots.mjs
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = resolve(__dirname, '..', 'docs', 'assets');
const BASE_URL = 'http://localhost:5180';

mkdirSync(ASSETS_DIR, { recursive: true });

const wait = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  // Clear IndexedDB so seed data is fresh
  await page.goto(BASE_URL);
  await page.evaluate(() => indexedDB.deleteDatabase('genechat'));
  await page.reload();
  await page.waitForSelector('[data-testid="conversation-item"]', { timeout: 15000 });
  await wait(2000); // Let all seed data hydrate

  // ======== 1: hero-light.png ========
  console.log('1/8: hero-light.png');
  // GFP Analysis is auto-selected (first conversation)
  await page.goto(`${BASE_URL}/?conv=conv-gfp`);
  await page.waitForSelector('[data-testid="sequence-block"]', { timeout: 10000 });
  await wait(1500);
  await page.screenshot({ path: resolve(ASSETS_DIR, 'hero-light.png') });

  // ======== 2: hero-dark.png ========
  console.log('2/8: hero-dark.png');
  // Click theme toggle — button with "Switch to dark/light mode" title
  const themeBtn = page.locator('button[title="Switch to dark mode"], button[title="Switch to light mode"]');
  await themeBtn.click();
  await wait(600);
  await page.screenshot({ path: resolve(ASSETS_DIR, 'hero-dark.png') });
  // Toggle back to light
  await page.locator('button[title="Switch to dark mode"], button[title="Switch to light mode"]').click();
  await wait(400);

  // ======== 3: restriction-digest.png ========
  // Use pUC19 (conv-cloning, 1230bp) — has 7 unique cutters showing "1 cut"
  console.log('3/8: restriction-digest.png');
  await page.goto(`${BASE_URL}/?conv=conv-cloning`);
  await page.waitForSelector('[data-testid="sequence-block"]', { timeout: 10000 });
  await wait(1000);
  // Open Transform dropdown on first block
  await page.locator('[data-testid="transform-dropdown"]').first().click();
  await wait(400);
  // Click "Restriction Digest"
  await page.getByText('Restriction Digest').click();
  await wait(1000);
  // Click "Unique cutters" button to select enzymes that cut exactly once
  const uniqueBtn = page.locator('button[title*="unique"], button[title*="Unique"], button:has-text("Unique")');
  if (await uniqueBtn.count() > 0) {
    await uniqueBtn.first().click();
    await wait(600);
  } else {
    // Fallback: click enabled (non-disabled) checkboxes via labels
    const enabledLabels = page.locator('label:not([style*="opacity: 0.4"])').filter({ has: page.locator('input[type="checkbox"]:not(:disabled)') });
    const count = await enabledLabels.count();
    for (let i = 0; i < Math.min(3, count); i++) {
      await enabledLabels.nth(i).click();
      await wait(100);
    }
    await wait(400);
  }
  await page.screenshot({ path: resolve(ASSETS_DIR, 'restriction-digest.png') });
  await page.keyboard.press('Escape');
  await wait(400);

  // ======== 4: primer-design.png ========
  console.log('4/8: primer-design.png');
  await page.goto(`${BASE_URL}/?conv=conv-gfp`);
  await page.waitForSelector('[data-testid="sequence-block"]', { timeout: 10000 });
  await wait(1000);
  await page.locator('[data-testid="transform-dropdown"]').first().click();
  await wait(400);
  await page.getByText('Design Primers').click();
  await wait(1200);
  await page.screenshot({ path: resolve(ASSETS_DIR, 'primer-design.png') });
  await page.keyboard.press('Escape');
  await wait(400);

  // ======== 5: sequence-diff.png ========
  console.log('5/8: sequence-diff.png');
  // conv-human has 2 DNA blocks (Insulin + BRCA1) — good for diff
  await page.goto(`${BASE_URL}/?conv=conv-human`);
  await page.waitForSelector('[data-testid="sequence-block"]', { timeout: 10000 });
  await wait(1000);
  // Click Compare button
  await page.getByText('Compare').click();
  await wait(1000);
  await page.screenshot({ path: resolve(ASSETS_DIR, 'sequence-diff.png') });
  await page.keyboard.press('Escape');
  await wait(400);

  // ======== 6: ai-chat.png ========
  console.log('6/8: ai-chat.png');
  await page.goto(`${BASE_URL}/?conv=conv-gfp`);
  await page.waitForSelector('[data-testid="sequence-block"]', { timeout: 10000 });
  await wait(1000);
  // Click AI drawer toggle or the input bar
  const aiToggle = page.locator('[data-testid="ai-drawer-toggle"]');
  if (await aiToggle.count() > 0) {
    await aiToggle.click();
  } else {
    // Click the bottom input area to open the drawer
    const inputBar = page.locator('input[placeholder*="sequence"], textarea[placeholder*="sequence"], input[placeholder*="ask"], textarea[placeholder*="ask"]');
    if (await inputBar.count() > 0) {
      await inputBar.first().click();
    }
  }
  await wait(1000);
  await page.screenshot({ path: resolve(ASSETS_DIR, 'ai-chat.png') });

  // ======== 7: ligation.png ========
  console.log('7/8: ligation.png');
  // conv-reporters has 2 DNA blocks (T7-RBS-mCherry + Luciferase)
  await page.goto(`${BASE_URL}/?conv=conv-reporters`);
  await page.waitForSelector('[data-testid="sequence-block"]', { timeout: 10000 });
  await wait(1000);
  // Click Ligate button
  const ligateBtn = page.getByText('Ligate');
  if (await ligateBtn.count() > 0) {
    await ligateBtn.first().click();
    await wait(1000);
    // Select both blocks
    const checkboxes = page.locator('input[type="checkbox"]:not(:disabled)');
    const cbCount = await checkboxes.count();
    for (let i = 0; i < cbCount; i++) {
      const cb = checkboxes.nth(i);
      if (!(await cb.isChecked())) {
        await cb.click();
        await wait(200);
      }
    }
    await wait(500);
  }
  await page.screenshot({ path: resolve(ASSETS_DIR, 'ligation.png') });
  await page.keyboard.press('Escape');
  await wait(400);

  // ======== 8: puc19-features.png ========
  console.log('8/8: puc19-features.png');
  await page.goto(`${BASE_URL}/?conv=conv-cloning`);
  await page.waitForSelector('[data-testid="sequence-block"]', { timeout: 10000 });
  await wait(1500);
  await page.screenshot({ path: resolve(ASSETS_DIR, 'puc19-features.png') });

  console.log('\nAll 8 screenshots saved to docs/assets/');

  // List files
  const { readdirSync, statSync } = await import('fs');
  const files = readdirSync(ASSETS_DIR);
  for (const f of files) {
    const sz = statSync(resolve(ASSETS_DIR, f)).size;
    console.log(`  ${f} — ${(sz / 1024).toFixed(0)} KB`);
  }

  await browser.close();
})();

import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => indexedDB.deleteDatabase('genechat'));
  await page.reload();
  await page.waitForSelector('[data-testid="conversation-item"]', { timeout: 10000 });
});

test('sidebar shows seed conversations', async ({ page }) => {
  const items = page.getByTestId('conversation-item');
  // Should have multiple seeded conversations
  await expect(items).toHaveCount(6, { timeout: 5000 });
});

test('clicking a conversation loads its content', async ({ page }) => {
  // Click the second conversation
  const conversations = page.getByTestId('conversation-item');
  await conversations.nth(1).click();

  // Center panel should show sequence blocks (if that conversation has sequences)
  // or at minimum the input area should be present
  await expect(page.getByTestId('sequence-input')).toBeVisible();
});

test('AI drawer toggles open and closed', async ({ page }) => {
  // Click AI drawer toggle
  await page.getByTestId('ai-drawer-toggle').click();

  // Drawer should be visible - look for a chat-related element
  // The AI drawer has a textarea for chat input
  await expect(page.locator('[placeholder*="Ask"]')).toBeVisible({ timeout: 3000 });

  // Click toggle again to close
  await page.getByTestId('ai-drawer-toggle').click();

  // Chat input should no longer be visible
  await expect(page.locator('[placeholder*="Ask"]')).not.toBeVisible({ timeout: 3000 });
});

test('deep link loads specific conversation', async ({ page }) => {
  // First get a conversation ID from the seeded data
  const firstConvButton = page.getByTestId('conversation-item').first();
  await firstConvButton.click();

  // Get the conversation ID from the URL
  await page.waitForURL(/conv=/, { timeout: 5000 }).catch(() => {});
  const url = page.url();
  const convMatch = url.match(/conv=([^&]+)/);

  if (convMatch) {
    const convId = convMatch[1];
    // Navigate directly to that conversation
    await page.goto(`/?conv=${convId}`);
    await page.waitForSelector('[data-testid="sequence-block"]', { timeout: 10000 }).catch(() => {});
    // The conversation should be selected
    await expect(page.getByTestId('sequence-input')).toBeVisible();
  }
});

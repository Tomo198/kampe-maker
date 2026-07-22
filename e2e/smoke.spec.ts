import { test, expect } from '@playwright/test'

test('app loads and shows the project list screen', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('h1')).toContainText('攻略カンペメーカー')
})

test('can navigate to editor screen', async ({ page }) => {
  await page.goto('/')
  await page.click('button[aria-label="エディターを開く"]')
  await expect(page.locator('[aria-label="メインツールバー"]')).toBeVisible()
  await expect(page.locator('[aria-label="キャンバス"]')).toBeVisible()
})

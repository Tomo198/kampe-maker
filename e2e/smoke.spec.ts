import { test, expect } from '@playwright/test'

test('app loads and shows the project list screen', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('h1')).toContainText('攻略カンペメーカー')
})

test('can navigate to editor screen and add an image', async ({ page }) => {
  await page.goto('/')
  await page.click('button[aria-label="エディターを開く"]')
  await expect(page.locator('[aria-label="メインツールバー"]')).toBeVisible()
  await expect(page.locator('[aria-label="キャンバス"]')).toBeVisible()

  // Wait for sidebar
  await expect(page.locator('text=画像を追加')).toBeVisible()

  // Generate a dummy image buffer for testing
  const buffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
  )

  // Upload
  await page.setInputFiles('input[type="file"]', {
    name: 'test.png',
    mimeType: 'image/png',
    buffer,
  })

  // The Konva canvas should eventually render an image
  // We can just verify if the stage container exists and maybe wait for no errors
  await expect(page.locator('.konvajs-content')).toBeVisible()

  // Wait a bit for image to load
  await page.waitForTimeout(1000)

  // Trigger export
  const downloadPromise = page.waitForEvent('download')
  await page.click('button[aria-label="画像を保存"]')
  const download = await downloadPromise

  expect(download.suggestedFilename()).toContain('.png')
})

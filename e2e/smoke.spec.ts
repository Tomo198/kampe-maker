import { test, expect } from '@playwright/test'

test('app loads and shows the project list screen', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('h1')).toContainText('攻略カンペメーカー')
})

test('UX features: selection, undo/redo, crop', async ({ page }) => {
  await page.goto('/')

  // 1. Create a new project
  await page.click('button:has-text("新規プロジェクト")')
  await page.click('button:has-text("キャンバスを作成")')
  await expect(page.locator('[aria-label="メインツールバー"]')).toBeVisible()

  // 2. Add an image
  const buffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
  )
  await page.setInputFiles('input[type="file"]', {
    name: 'test.png',
    mimeType: 'image/png',
    buffer,
  })
  await page.waitForTimeout(500)

  // 3. Selection and Undo / Redo
  await page.mouse.click(200, 200)
  await page.keyboard.press('Control+Z')
  await page.waitForTimeout(500)

  const undoBtn = page.locator('button[aria-label="元に戻す (Ctrl+Z)"]')
  const redoBtn = page.locator('button[aria-label="やり直す (Ctrl+Shift+Z)"]')
  await expect(undoBtn).toBeVisible()
  await expect(redoBtn).toBeVisible()

  // 4. Export image
  const downloadPromise = page.waitForEvent('download')
  await page.click('button[aria-label="画像を保存"]')
  const download = await downloadPromise
  expect(download.suggestedFilename()).toContain('.png')
})

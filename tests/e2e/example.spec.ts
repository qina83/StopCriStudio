import { test, expect } from '@playwright/test'

test.describe('OpenAPI Visual Editor', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.clear())
    await page.goto('/')
  })

  test('should display the landing page', async ({ page }) => {
    await expect(page).toHaveTitle('OpenAPI Visual Editor')
    await expect(page.locator('h1')).toContainText('OpenAPI Visual Editor')
  })

  test('should display create and upload buttons', async ({ page }) => {
    const createButton = page.locator('button:has-text("Create New API")')
    const uploadButton = page.locator('button:has-text("Upload Existing File")')

    await expect(createButton).toBeVisible()
    await expect(uploadButton).toBeVisible()
  })
})

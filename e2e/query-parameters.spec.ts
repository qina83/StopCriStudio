import { expect, test } from '@playwright/test'
import { addOperation, createPath, resetAppState } from './helpers/editor'

test.beforeEach(async ({ page }) => {
  await resetAppState(page)
})

test('adds, edits, and deletes a query parameter', async ({ page }) => {
  await createPath(page, '/search')
  await addOperation(page, 'GET')

  await page.locator('button').filter({ hasText: /^Add parameter$/ }).first().click()
  const modal = page.locator('.fixed.inset-0').last()
  await modal.getByPlaceholder('parameterName').fill('q')
  await modal.locator('textarea').fill('Search query')
  await modal.locator('input[type="checkbox"]').check()
  await modal.locator('button').filter({ hasText: /^Save$/ }).click()

  await expect(page.getByText('q', { exact: true })).toBeVisible()
  await expect(page.getByText('required')).toBeVisible()

  await page.getByLabel('Edit query parameter').click()
  const editModal = page.locator('.fixed.inset-0').last()
  await editModal.locator('textarea').fill('Primary query string')
  await editModal.locator('button').filter({ hasText: /^Save$/ }).click()

  await expect(page.getByText('Primary query string')).not.toBeVisible()
  await page.getByLabel('Delete query parameter').click()
  await page.locator('.fixed.inset-0').last().locator('button').filter({ hasText: /^Delete$/ }).click()
  await expect(page.getByText('No query parameters defined')).toBeVisible()
})
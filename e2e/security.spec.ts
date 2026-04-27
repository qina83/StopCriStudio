import { expect, test } from '@playwright/test'
import { addOperation, createPath, resetAppState } from './helpers/editor'

test.beforeEach(async ({ page }) => {
  await resetAppState(page)
})

test('adds, edits, and deletes an operation security requirement', async ({ page }) => {
  await createPath(page, '/orders')
  await addOperation(page, 'GET')

  await page.getByRole('button', { name: '+ Add security' }).click()
  const addModal = page.locator('.fixed.inset-0').last()
  await addModal.getByPlaceholder('ApiKeyAuth').fill('ApiKeyAuth')
  await addModal.getByPlaceholder('X-API-Key').fill('X-API-Key')
  await addModal.locator('button').filter({ hasText: /^Save$/ }).click()

  await expect(page.getByText('ApiKeyAuth', { exact: true })).toBeVisible()
  await expect(page.getByText('apiKey', { exact: true })).toBeVisible()

  await page.getByLabel('Edit ApiKeyAuth').click()
  const editModal = page.locator('.fixed.inset-0').last()
  await editModal.locator('select').first().selectOption('http')
  await editModal.getByPlaceholder('BearerAuth').fill('BearerAuth')
  await editModal.locator('select').nth(1).selectOption('bearer')
  await editModal.getByPlaceholder('JWT').fill('JWT')
  await editModal.locator('button').filter({ hasText: /^Save$/ }).click()

  await expect(page.getByText('BearerAuth', { exact: true })).toBeVisible()
  await expect(page.getByText('http', { exact: true })).toBeVisible()

  await page.getByLabel('Delete BearerAuth').click()
  await expect(page.getByText('No security requirements defined for this operation.')).toBeVisible()
})
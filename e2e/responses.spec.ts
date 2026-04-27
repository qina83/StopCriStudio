import { expect, test } from '@playwright/test'
import { addOperation, createPath, resetAppState } from './helpers/editor'

test.beforeEach(async ({ page }) => {
  await resetAppState(page)
})

test('adds a response with an inline schema and previews its structure', async ({ page }) => {
  await createPath(page, '/orders')
  await addOperation(page, 'GET')

  await page.getByRole('button', { name: 'Add Response' }).click()
  const responseModal = page.locator('.fixed.inset-0').last()
  await responseModal.getByPlaceholder('200 or default').fill('201')
  await responseModal.getByPlaceholder('Describe this response').fill('Created order')
  await responseModal.locator('button').filter({ hasText: /^Inline schema$/ }).click()
  await responseModal.locator('button').filter({ hasText: /^Add property$/ }).first().click()

  const propertyModal = page.locator('.fixed.inset-0').last()
  await propertyModal.getByPlaceholder('propertyName').fill('id')
  await propertyModal.locator('button').filter({ hasText: /^Save$/ }).click()

  await responseModal.locator('button').filter({ hasText: /^Save response$/ }).click()

  await expect(page.getByText('201', { exact: true })).toBeVisible()
  await expect(page.getByText('Created order')).toBeVisible()
  await page.getByLabel('Expand response structure').last().click()
  await expect(page.getByText('id', { exact: true })).toBeVisible()
})
import { expect, test } from '@playwright/test'
import { addOperation, createPath, resetAppState } from './helpers/editor'

test.beforeEach(async ({ page }) => {
  await resetAppState(page)
})

test('creates a reusable schema from an inline request body model', async ({ page }) => {
  await createPath(page, '/orders')
  await addOperation(page, 'POST')

  await page.locator('button').filter({ hasText: /^Add property$/ }).first().click()
  const propertyModal = page.locator('.fixed.inset-0').last()
  await propertyModal.getByPlaceholder('propertyName').fill('orderId')
  await propertyModal.locator('select').first().selectOption('integer')
  await propertyModal.locator('input[type="checkbox"]').check()
  await propertyModal.locator('button').filter({ hasText: /^Save$/ }).click()

  await expect(page.getByText('orderId', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Create reusable schema from inline model' }).click()
  const createSchemaModal = page.locator('.fixed.inset-0').last()
  await createSchemaModal.getByPlaceholder('UserPayload').fill('OrderPayload')
  await createSchemaModal.locator('button').filter({ hasText: /^Create schema$/ }).click()

  await expect(page.getByText('Using schema reference: OrderPayload')).toBeVisible()

  await page.getByRole('button', { name: 'Schemas' }).click()
  await expect(page.locator('button').filter({ hasText: /^OrderPayload$/ }).first()).toBeVisible()
})
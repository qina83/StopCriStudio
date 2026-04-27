import { expect, test } from '@playwright/test'
import { addOperation, createPath, resetAppState } from './helpers/editor'

test.beforeEach(async ({ page }) => {
  await resetAppState(page)
})

test('adds and deletes an operation from the path workflow', async ({ page }) => {
  await createPath(page, '/orders')
  await addOperation(page, 'POST')

  await expect(page.getByText('POST operation')).toBeVisible()
  await expect(page.getByText('No query parameters defined')).toBeVisible()
  await expect(page.locator('button').filter({ hasText: /^Add property$/ }).first()).toBeVisible()
  await expect(page.getByRole('button', { name: 'Add Response' })).toBeVisible()
  await expect(page.getByText('No security requirements defined for this operation.')).toBeVisible()

  await page.getByRole('button', { name: 'Delete Operation' }).click()
  await page.locator('.fixed.inset-0').last().locator('button').filter({ hasText: /^Delete$/ }).click()

  await expect(page.getByRole('button', { name: 'Delete Operation' })).not.toBeVisible()
  await expect(page.getByText('POST operation')).not.toBeVisible()
})
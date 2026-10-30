import { expect, test } from '@playwright/test'
import { addOperation, createPath, resetAppState } from './helpers/editor'
import { confirmDeletion, saveTreeNode } from './helpers/parameterTree'
import { expectPersistedContent, exportSpecification, getPersistedContent, openOperation, reloadSavedSpecification } from './helpers/specification'

test.beforeEach(async ({ page }) => {
  await resetAppState(page)
})

test('keeps query and body edits isolated between HTTP methods and cancels operation deletion (WP-019, WP-025)', async ({ page }) => {
  await createPath(page, '/orders')
  await addOperation(page, 'GET')
  await page.getByRole('button', { name: 'Add parameter', exact: true }).first().click()
  await saveTreeNode(page, 'id', 'integer')
  await page.getByPlaceholder('Describe what this operation does, expected behavior, side effects, etc.').fill('Read orders')
  const before = await exportSpecification(page)
  await addOperation(page, 'POST')
  await expect(page.getByText('No query parameters defined')).toBeVisible()
  await page.getByRole('button', { name: 'Add parameter', exact: true }).first().click()
  await saveTreeNode(page, 'id', 'string')
  await page.getByRole('button', { name: 'Add property', exact: true }).first().click()
  await saveTreeNode(page, 'orderId', 'integer', { required: true })
  expect(await exportSpecification(page)).toMatchObject(before)
  await page.getByRole('button', { name: 'Delete Operation', exact: true }).click()
  await page.locator('.fixed.inset-0').last().getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(page.getByText('orderId', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Delete Operation', exact: true }).click()
  await confirmDeletion(page)
  const exported = await exportSpecification(page)
  expect(exported).not.toHaveProperty(['paths', '/orders', 'post'])
  expect(exported).toEqual(before)
  await expectPersistedContent(page, { paths: { '/orders': { get: { description: 'Read orders' } } } })
  await expect.poll(() => getPersistedContent(page)).not.toHaveProperty(['paths', '/orders', 'post'])
  await reloadSavedSpecification(page)
  await openOperation(page, '/orders', 'GET')
  await expect(page.getByText('id', { exact: true })).toBeVisible()
  expect(await exportSpecification(page)).toEqual(before)
})

test('preserves path parameters and operations when renaming a route (WP-005, WP-006)', async ({ page }) => {
  await createPath(page, '/orders/{id}')
  await page.getByRole('combobox').selectOption('integer')
  await page.getByText('Click to add...', { exact: true }).click()
  await page.getByPlaceholder('Enter description...').fill('Order identifier')
  await page.getByPlaceholder('Enter description...').press('Enter')
  await addOperation(page, 'GET')
  await page.getByRole('button', { name: 'Add parameter', exact: true }).first().click()
  await saveTreeNode(page, 'id', 'string')
  await addOperation(page, 'DELETE')
  await page.getByLabel('Edit path name', { exact: true }).click()
  await page.getByPlaceholder('/api/resource').fill('')
  await page.getByLabel('Save path name', { exact: true }).click()
  await expect(page.getByText('Path name cannot be empty')).toBeVisible()
  await page.getByPlaceholder('/api/resource').fill('/discarded')
  await page.getByLabel('Cancel editing path name', { exact: true }).click()
  await expect(page.getByText('Editing /orders/{id}', { exact: true })).toBeVisible()
  await page.getByLabel('Edit path name', { exact: true }).click()
  await page.getByPlaceholder('/api/resource').fill('/purchases/{id}')
  await page.getByLabel('Save path name', { exact: true }).click()
  await expect(page.getByText('Editing /purchases/{id}', { exact: true })).toBeVisible()
  const exported = await exportSpecification(page)
  const pathParameter = {
    in: 'path', name: 'id', required: true, description: 'Order identifier',
    schema: { type: 'integer', description: 'Order identifier' },
  }
  expect(exported).not.toHaveProperty(['paths', '/orders/{id}'])
  expect(exported).not.toHaveProperty(['paths', '/purchases/{id}', 'parameters'])
  expect(exported).toHaveProperty(['paths', '/purchases/{id}', 'get', 'parameters'], [
    pathParameter, { in: 'query', name: 'id', schema: { type: 'string' } },
  ])
  expect(exported).toHaveProperty(['paths', '/purchases/{id}', 'delete', 'parameters'], [pathParameter])
  await expectPersistedContent(page, { paths: { '/purchases/{id}': { parameters: [
    { name: 'id', type: 'integer', description: 'Order identifier' },
  ] } } })
  await reloadSavedSpecification(page)
  expect(await exportSpecification(page)).toEqual(exported)
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
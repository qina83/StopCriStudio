import { expect, test } from '@playwright/test'
import { addOperation, createPath, resetAppState } from './helpers/editor'
import { confirmDeletion, saveTreeNode, treeRow } from './helpers/parameterTree'
import { expectPersistedContent, exportSpecification, importSpecification, openOperation, reloadSavedSpecification } from './helpers/specification'

test.beforeEach(async ({ page }) => {
  await resetAppState(page)
})

test('preserves nested body fields and required arrays through edit, delete, and reload (WP-023, WP-025, WP-026)', async ({ page }) => {
  await createPath(page, '/orders')
  await addOperation(page, 'POST')
  await page.getByPlaceholder('Describe the request body…').fill('Order payload')
  await page.getByRole('checkbox', { name: 'Required' }).check()
  await page.getByRole('button', { name: 'Add property', exact: true }).first().click()
  await saveTreeNode(page, 'order', 'object', { required: true })
  await treeRow(page, 'order').getByRole('button', { name: 'Expand', exact: true }).click()
  await page.getByRole('button', { name: 'Add property', exact: true }).last().click()
  await saveTreeNode(page, 'lines', 'array', { itemType: 'object', required: true })
  await treeRow(page, 'lines').getByRole('button', { name: 'Expand', exact: true }).click()
  await page.getByRole('button', { name: 'Add item property', exact: true }).click()
  await saveTreeNode(page, 'sku', 'string', { required: true, description: 'Product identifier' })
  await page.getByRole('button', { name: 'Add item property', exact: true }).click()
  await saveTreeNode(page, 'quantity', 'integer')
  await treeRow(page, 'sku').getByLabel('Edit property', { exact: true }).click()
  await saveTreeNode(page, 'productId', 'string', { required: true, description: 'Updated identifier' })
  await treeRow(page, 'order').getByLabel('Edit property', { exact: true }).click()
  await saveTreeNode(page, 'payload', 'object', { required: true })
  await treeRow(page, 'quantity').getByLabel('Delete property', { exact: true }).click()
  await page.locator('.fixed.inset-0').last().getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(page.getByText('quantity', { exact: true })).toBeVisible()
  await treeRow(page, 'quantity').getByLabel('Delete property', { exact: true }).click()
  await confirmDeletion(page)
  await expect(page.getByText('quantity', { exact: true })).not.toBeVisible()

  const expectedBody = {
    required: true, description: 'Order payload',
    content: { 'application/json': { schema: {
      type: 'object', required: ['payload'], properties: {
        payload: { type: 'object', required: ['lines'], properties: {
          lines: { type: 'array', items: { type: 'object', required: ['productId'], properties: {
            productId: { type: 'string', description: 'Updated identifier' },
          } } },
        } },
      },
    } } },
  }
  expect(await exportSpecification(page)).toHaveProperty(['paths', '/orders', 'post', 'requestBody'], expectedBody)
  await expectPersistedContent(page, { paths: { '/orders': { post: {
    _requestBody: { required: true, description: 'Order payload', properties: [{ name: 'payload' }] },
  } } } })
  await reloadSavedSpecification(page)
  await openOperation(page, '/orders', 'POST')
  expect(await exportSpecification(page)).toHaveProperty(['paths', '/orders', 'post', 'requestBody'], expectedBody)
  await treeRow(page, 'payload').getByLabel('Delete property', { exact: true }).click()
  await confirmDeletion(page)
  await expect(page.getByText('No properties defined', { exact: true })).toBeVisible()
  expect(await exportSpecification(page)).toHaveProperty(
    ['paths', '/orders', 'post', 'requestBody', 'content', 'application/json', 'schema'],
    { type: 'object' },
  )
})

test('validates body property names and duplicate edits at the same tree level (WP-025)', async ({ page }) => {
  await createPath(page, '/orders')
  await addOperation(page, 'POST')
  await page.getByRole('button', { name: 'Add property', exact: true }).first().click()
  const modal = page.locator('.fixed.inset-0').last()
  await modal.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(modal.getByText('Name is required', { exact: true })).toBeVisible()
  await modal.getByPlaceholder('propertyName').fill('bad-name')
  await modal.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(modal.getByText('Name must start with a letter', { exact: false })).toBeVisible()
  await saveTreeNode(page, 'first')
  await page.getByRole('button', { name: 'Add property', exact: true }).first().click()
  await modal.getByPlaceholder('propertyName').fill('first')
  await modal.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(modal.getByText('A property with this name already exists at this level')).toBeVisible()
  await saveTreeNode(page, 'second')
  await treeRow(page, 'second').getByLabel('Edit property', { exact: true }).click()
  await modal.getByPlaceholder('propertyName').fill('first')
  await modal.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(modal.getByText('A property with this name already exists at this level')).toBeVisible()
  await modal.getByRole('button', { name: 'Cancel', exact: true }).click()
  expect(await exportSpecification(page)).toHaveProperty(
    ['paths', '/orders', 'post', 'requestBody', 'content', 'application/json', 'schema', 'properties'],
    { first: { type: 'string' }, second: { type: 'string' } },
  )
})

test('cancels property edits without changing the saved body (WP-025)', async ({ page }) => {
  await createPath(page, '/orders')
  await addOperation(page, 'POST')
  await page.getByRole('button', { name: 'Add property', exact: true }).first().click()
  await saveTreeNode(page, 'id', 'integer', { description: 'Original identifier' })
  const before = await exportSpecification(page)
  await treeRow(page, 'id').getByLabel('Edit property', { exact: true }).click()
  await page.getByPlaceholder('propertyName').fill('discarded')
  await page.getByPlaceholder('Describe this property…').fill('Discarded edit')
  await page.locator('.fixed.inset-0').last().getByRole('button', { name: 'Cancel', exact: true }).click()
  expect(await exportSpecification(page)).toEqual(before)
  await reloadSavedSpecification(page)
  expect(await exportSpecification(page)).toEqual(before)
})

test('requires confirmation before changing media type and clearing body fields (WP-024)', async ({ page }) => {
  await createPath(page, '/orders')
  await addOperation(page, 'POST')
  await page.getByRole('button', { name: 'Add property', exact: true }).first().click()
  await saveTreeNode(page, 'id')
  const mediaType = page.getByRole('combobox').filter({ has: page.getByRole('option', { name: 'application/json', exact: true }) })
  await mediaType.selectOption('text/plain')
  const modal = page.locator('.fixed.inset-0').last()
  await expect(modal.getByRole('heading', { name: 'Change media type' })).toBeVisible()
  await modal.getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(mediaType).toHaveValue('application/json')
  await expect(page.getByText('id', { exact: true })).toBeVisible()
  await mediaType.selectOption('__custom__')
  await page.getByPlaceholder('e.g. application/vnd.api+json').fill('application/vnd.orders+json')
  await page.getByRole('button', { name: 'Set', exact: true }).click()
  await modal.getByRole('button', { name: 'Change and clear', exact: true }).click()
  await expect(page.getByText('No properties defined', { exact: true })).toBeVisible()
  expect(await exportSpecification(page)).toHaveProperty(
    ['paths', '/orders', 'post', 'requestBody', 'content'],
    { 'application/vnd.orders+json': { schema: { type: 'object' } } },
  )
})

test('requires a selected schema for an object reference and exports it without inline fields (WP-037)', async ({ page }) => {
  await importSpecification(page, {
    openapi: '3.0.0', info: { title: 'Body reference API', version: '1.0.0' },
    paths: { '/orders': { post: {} } },
    components: { schemas: { Address: { type: 'object', properties: { city: { type: 'string' } } } } },
  })
  await openOperation(page, '/orders', 'POST')
  await page.getByRole('button', { name: 'Add property', exact: true }).first().click()
  const modal = page.locator('.fixed.inset-0').last()
  await modal.getByPlaceholder('propertyName').fill('address')
  await modal.getByRole('combobox').first().selectOption('object')
  await modal.getByRole('button', { name: 'Use schema reference ($ref)', exact: true }).click()
  await modal.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(modal.getByText('Select a schema reference before saving')).toBeVisible()
  await modal.getByRole('combobox').nth(1).selectOption('Address')
  await modal.getByRole('checkbox', { name: 'Required' }).check()
  await modal.getByRole('button', { name: 'Save', exact: true }).click()
  const row = treeRow(page, 'address')
  await expect(row.getByText('$ref: Address', { exact: true })).toBeVisible()
  await expect(row.getByLabel('Edit property', { exact: true })).toHaveCount(0)
  await row.getByRole('button', { name: 'Expand', exact: true }).click()
  await expect(page.getByText('city', { exact: true })).toBeVisible()
  await expect(page.getByText('Referenced schema is read-only here. Edit it in the Schemas panel.')).toBeVisible()
  expect(await exportSpecification(page)).toHaveProperty(
    ['paths', '/orders', 'post', 'requestBody', 'content', 'application/json', 'schema'],
    { type: 'object', required: ['address'], properties: { address: { $ref: '#/components/schemas/Address' } } },
  )
})

test('keeps same-named fields in separate scopes after deleting an earlier root sibling (WP-025)', async ({ page }) => {
  await createPath(page, '/orders')
  await addOperation(page, 'POST')
  await page.getByRole('button', { name: 'Add property', exact: true }).first().click()
  await saveTreeNode(page, 'code')
  await page.getByRole('button', { name: 'Add property', exact: true }).first().click()
  await saveTreeNode(page, 'details', 'object')
  await treeRow(page, 'details').getByRole('button', { name: 'Expand', exact: true }).click()
  await page.getByRole('button', { name: 'Add property', exact: true }).last().click()
  await saveTreeNode(page, 'code', 'integer')
  await page.getByLabel('Delete property', { exact: true }).first().click()
  await confirmDeletion(page)
  await treeRow(page, 'details').getByRole('button', { name: 'Expand', exact: true }).click()
  await treeRow(page, 'code').getByLabel('Edit property', { exact: true }).click()
  await saveTreeNode(page, 'productCode', 'integer')
  expect(await exportSpecification(page)).toHaveProperty(
    ['paths', '/orders', 'post', 'requestBody', 'content', 'application/json', 'schema'],
    { type: 'object', properties: { details: { type: 'object', properties: { productCode: { type: 'integer' } } } } },
  )
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
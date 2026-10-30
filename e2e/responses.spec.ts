import { expect, test } from '@playwright/test'
import { addOperation, createPath, resetAppState } from './helpers/editor'
import { confirmDeletion, saveTreeNode, treeRow } from './helpers/parameterTree'
import { exportSpecification, importSpecification, openOperation, reloadSavedSpecification } from './helpers/specification'

test.beforeEach(async ({ page }) => {
  await resetAppState(page)
})

test('validates status codes, media types, schema selection and duplicate responses (WP-040)', async ({ page }) => {
  await createPath(page, '/orders')
  await addOperation(page, 'GET')
  await page.getByRole('button', { name: 'Add Response', exact: true }).click()
  const modal = page.locator('.fixed.inset-0').last()
  for (const status of ['99', '600', '2xx', 'invalid']) {
    await modal.getByPlaceholder('200 or default').fill(status)
    await modal.getByRole('button', { name: 'Save response', exact: true }).click()
    await expect(modal.getByText('Status code must be 100-599 or default.')).toBeVisible()
  }
  await modal.getByPlaceholder('200 or default').fill('201')
  await modal.getByPlaceholder('application/json', { exact: true }).fill('')
  await modal.getByRole('button', { name: 'Save response', exact: true }).click()
  await expect(modal.getByText('Media type is required.')).toBeVisible()
  await modal.getByPlaceholder('application/json', { exact: true }).fill('application/json')
  await modal.getByRole('button', { name: 'Schema reference', exact: true }).click()
  await modal.getByRole('button', { name: 'Save response', exact: true }).click()
  await expect(modal.getByText('Select a schema reference before saving.')).toBeVisible()
  await modal.getByRole('button', { name: 'No model', exact: true }).click()
  await modal.getByRole('button', { name: 'Save response', exact: true }).click()
  await expect(page.getByText('201', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Add Response', exact: true }).click()
  await modal.getByPlaceholder('200 or default').fill('201')
  await modal.getByRole('button', { name: 'Save response', exact: true }).click()
  await expect(modal.getByText('Response 201 + application/json already exists for this operation.')).toBeVisible()
  await modal.getByRole('button', { name: 'Cancel', exact: true }).click()
  expect(await exportSpecification(page)).toHaveProperty(['paths', '/orders', 'get', 'responses', '201'], {
    description: 'Response', content: { 'application/json': {} },
  })
})

test('edits and deletes one response media type without losing its sibling or examples (WP-041, WP-042)', async ({ page }) => {
  const jsonEntry = { schema: { type: 'object', properties: { id: { type: 'integer' } } }, example: { id: 7 } }
  const textEntry = { schema: { type: 'string' }, example: 'order-7' }
  await importSpecification(page, {
    openapi: '3.0.0', info: { title: 'Responses API', version: '1.0.0' },
    paths: { '/orders': { get: { responses: { '200': {
      description: 'Order result',
      content: { 'application/json': jsonEntry, 'text/plain': textEntry },
    } } } } },
  })
  await openOperation(page, '/orders', 'GET')
  await page.getByRole('button', { name: 'Edit', exact: true }).first().click()
  const modal = page.locator('.fixed.inset-0').last()
  await modal.getByPlaceholder('application/json', { exact: true }).fill('application/vnd.orders+json')
  await modal.getByRole('button', { name: 'Save response', exact: true }).click()
  const expectedContent = { 'application/vnd.orders+json': jsonEntry, 'text/plain': textEntry }
  expect(await exportSpecification(page)).toHaveProperty(['paths', '/orders', 'get', 'responses', '200', 'content'], expectedContent)
  await page.getByRole('button', { name: 'Delete', exact: true }).first().click()
  await page.locator('.fixed.inset-0').last().getByRole('button', { name: 'Cancel', exact: true }).click()
  expect(await exportSpecification(page)).toHaveProperty(['paths', '/orders', 'get', 'responses', '200', 'content'], expectedContent)
  await page.getByRole('button', { name: 'Delete', exact: true }).first().click()
  await confirmDeletion(page)
  expect(await exportSpecification(page)).toHaveProperty(['paths', '/orders', 'get', 'responses', '200', 'content'], { 'text/plain': textEntry })
  await page.getByRole('button', { name: 'Delete', exact: true }).click()
  await confirmDeletion(page)
  await expect(page.getByText('No responses defined', { exact: false })).toBeVisible()
  expect(await exportSpecification(page)).toHaveProperty(['paths', '/orders', 'get', 'responses'], {
    '200': { description: 'Successful response' },
  })
})

test('discards nested response edits on cancel and extracts the saved model as a reusable schema (WP-043, WP-046)', async ({ page }) => {
  await createPath(page, '/orders')
  await addOperation(page, 'GET')
  const before = await exportSpecification(page)
  await page.getByRole('button', { name: 'Add Response', exact: true }).click()
  const responseModal = page.locator('.fixed.inset-0').last()
  await responseModal.getByPlaceholder('200 or default').fill('201')
  await responseModal.getByRole('button', { name: 'Inline schema', exact: true }).click()
  await responseModal.getByRole('button', { name: 'Add property', exact: true }).first().click()
  await saveTreeNode(page, 'lines', 'array', { itemType: 'object', required: true })
  await treeRow(responseModal, 'lines').getByRole('button', { name: 'Expand', exact: true }).click()
  await responseModal.getByRole('button', { name: 'Add item property', exact: true }).click()
  await saveTreeNode(page, 'sku', 'string', { required: true })
  await responseModal.getByRole('button', { name: 'Cancel', exact: true }).click()
  expect(await exportSpecification(page)).toEqual(before)
  await page.getByRole('button', { name: 'Add Response', exact: true }).click()
  await responseModal.getByPlaceholder('200 or default').fill('201')
  await responseModal.getByRole('button', { name: 'Inline schema', exact: true }).click()
  await responseModal.getByRole('button', { name: 'Add property', exact: true }).first().click()
  await saveTreeNode(page, 'id', 'integer', { required: true })
  await responseModal.getByRole('button', { name: 'Save response', exact: true }).click()
  await page.getByRole('button', { name: 'Create schema', exact: true }).click()
  const createModal = page.locator('.fixed.inset-0').last()
  await createModal.getByRole('button', { name: 'Create schema', exact: true }).click()
  await expect(createModal.getByText('Schema name is required.')).toBeVisible()
  await createModal.getByPlaceholder('UserResponse').fill('OrderResult')
  await createModal.getByRole('button', { name: 'Create schema', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Open schema: OrderResult' })).toBeVisible()
  const exported = await exportSpecification(page)
  expect(exported).toHaveProperty(['components', 'schemas', 'OrderResult'], {
    type: 'object', required: ['id'], properties: { id: { type: 'integer' } },
  })
  expect(exported).toHaveProperty(['paths', '/orders', 'get', 'responses', '201', 'content', 'application/json', 'schema'], {
    $ref: '#/components/schemas/OrderResult',
  })
  await reloadSavedSpecification(page)
  expect(await exportSpecification(page)).toEqual(exported)
})

test('renders missing and circular response references safely (WP-044)', async ({ page }) => {
  await importSpecification(page, {
    openapi: '3.0.0', info: { title: 'References API', version: '1.0.0' },
    paths: { '/orders': { get: { responses: {
      '200': { description: 'Recursive model', content: { 'application/json': { schema: { $ref: '#/components/schemas/Node' } } } },
      '404': { description: 'Missing model', content: { 'application/json': { schema: { $ref: '#/components/schemas/Missing' } } } },
    } } } },
    components: { schemas: { Node: {
      type: 'object', properties: { child: { $ref: '#/components/schemas/Node' } },
    } } },
  })
  await openOperation(page, '/orders', 'GET')
  await page.getByLabel('Expand response structure').first().click()
  await expect(page.getByText('Circular reference detected. Nested preview is truncated.')).toBeVisible()
  await page.getByRole('button', { name: 'Open schema: Missing' }).click()
  await expect(page.getByText('Schema "Missing" does not exist in components/schemas and cannot be opened.')).toBeVisible()
  expect(await exportSpecification(page)).toHaveProperty(
    ['paths', '/orders', 'get', 'responses', '404', 'content', 'application/json', 'schema'],
    { $ref: '#/components/schemas/Missing' },
  )
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
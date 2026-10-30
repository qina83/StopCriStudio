import { expect, test } from '@playwright/test'
import { resetAppState } from './helpers/editor'
import { confirmDeletion, saveTreeNode, treeRow } from './helpers/parameterTree'
import { exportSpecification, importSpecification, reloadSavedSpecification } from './helpers/specification'

// WP-035, WP-036: shared body editor and schema reference regression coverage.
const model = { type: 'object', properties: { id: { type: 'integer' } } }
const ref = { $ref: '#/components/schemas/Order' }
const referenceDocument = {
  openapi: '3.0.0', info: { title: 'Schema references API', version: '1.0.0' },
  paths: {
    '/orders': {
      post: {
        requestBody: { content: { 'application/json': { schema: ref } } },
        responses: { '201': { description: 'Created', content: { 'application/json': { schema: ref } } } },
      },
      put: {
        requestBody: { content: { 'application/json': { schema: {
          type: 'object', properties: {
            order: ref, orders: { type: 'array', items: ref },
          },
        } } } },
      },
    },
  },
  components: { schemas: {
    Order: model,
    Envelope: { type: 'object', properties: { order: ref, orders: { type: 'array', items: ref } } },
  } },
}

test.beforeEach(async ({ page }) => {
  await resetAppState(page)
})

test('creates and edits nested schema fields and deletes the schema after confirmation', async ({ page }) => {
  await page.getByRole('button', { name: 'Create a new OpenAPI specification' }).click()
  await page.getByRole('button', { name: 'Schemas', exact: true }).click()
  await page.getByRole('button', { name: 'Add Schema', exact: true }).first().click()
  const editor = page.locator('.fixed.inset-0').last()
  await editor.getByRole('button', { name: 'Save Schema', exact: true }).click()
  await expect(editor.getByText('Schema name is required.')).toBeVisible()
  await editor.getByPlaceholder('UserResponse').fill('Invalid schema!')
  await editor.getByRole('button', { name: 'Save Schema', exact: true }).click()
  await expect(editor.getByText('Schema name must contain only letters', { exact: false })).toBeVisible()
  await editor.getByPlaceholder('UserResponse').fill('Order')
  await editor.getByRole('button', { name: 'Add property', exact: true }).first().click()
  await saveTreeNode(page, 'lines', 'array', { itemType: 'object', required: true })
  await treeRow(editor, 'lines').getByRole('button', { name: 'Expand', exact: true }).click()
  await editor.getByRole('button', { name: 'Add item property', exact: true }).click()
  await saveTreeNode(page, 'sku', 'string', { required: true })
  await editor.getByRole('button', { name: 'Save Schema', exact: true }).click()
  await expect(page.getByText('Schema saved successfully.')).toBeVisible()
  await page.getByRole('button', { name: 'Edit', exact: true }).click()
  await treeRow(editor, 'lines').getByRole('button', { name: 'Expand', exact: true }).click()
  await treeRow(editor, 'sku').getByLabel('Edit property', { exact: true }).click()
  await saveTreeNode(page, 'productId', 'integer', { required: true })
  await editor.getByRole('button', { name: 'Save Schema', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Edit Schema: Order', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(page.getByPlaceholder('UserResponse')).not.toBeVisible()
  expect(await exportSpecification(page)).toHaveProperty(['components', 'schemas', 'Order'], {
    type: 'object', required: ['lines'], properties: {
      lines: { type: 'array', items: { type: 'object', required: ['productId'], properties: {
        productId: { type: 'integer' },
      } } },
    },
  })
  await reloadSavedSpecification(page)
  await page.getByRole('button', { name: /^Schemas(?:\s|$)/ }).click()
  await page.getByRole('button', { name: 'Delete', exact: true }).click()
  await page.locator('.fixed.inset-0').last().getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(page.getByText('Order', { exact: true }).last()).toBeVisible()
  await page.getByRole('button', { name: 'Delete', exact: true }).click()
  await confirmDeletion(page)
  await expect(page.getByText('No schemas defined yet')).toBeVisible()
  expect(await exportSpecification(page)).not.toHaveProperty(['components', 'schemas', 'Order'])
})

test('rejects duplicate schemas and discards cancelled schema edits', async ({ page }) => {
  await importSpecification(page, referenceDocument)
  await page.getByRole('button', { name: /^Schemas(?:\s|$)/ }).click()
  const before = await exportSpecification(page)
  await page.getByRole('button', { name: 'Add Schema', exact: true }).click()
  const editor = page.locator('.fixed.inset-0').last()
  await editor.getByPlaceholder('UserResponse').fill('Order')
  await editor.getByRole('button', { name: 'Save Schema', exact: true }).click()
  await expect(editor.getByText('A schema with this name already exists.').first()).toBeVisible()
  await editor.getByRole('button', { name: 'Cancel', exact: true }).click()
  await page.getByRole('button', { name: 'Order', exact: true }).click()
  await treeRow(editor, 'id').getByLabel('Delete property', { exact: true }).click()
  await confirmDeletion(page)
  await editor.getByRole('button', { name: 'Cancel', exact: true }).click()
  expect(await exportSpecification(page)).toEqual(before)
})

for (const strategy of ['rename-all', 'create-new'] as const) {
  test(`applies the ${strategy} schema rename strategy to direct, nested and array references`, async ({ page }) => {
    await importSpecification(page, referenceDocument)
    await page.getByRole('button', { name: /^Schemas(?:\s|$)/ }).click()
    await page.getByRole('button', { name: 'Order', exact: true }).click()
    const editor = page.locator('.fixed.inset-0').last()
    await expect(editor.getByText('POST /orders', { exact: true })).toBeVisible()
    await expect(editor.getByText('PUT /orders', { exact: true })).toBeVisible()
    await editor.getByPlaceholder('UserResponse').fill('RenamedOrder')
    await editor.getByRole('button', { name: 'Save Schema', exact: true }).click()
    const prompt = page.locator('.fixed.inset-0').last()
    await prompt.getByRole('button', {
      name: strategy === 'rename-all'
        ? /^Rename all schema references/
        : /^Create a new schema and keep existing references unchanged/,
    }).click()
    if (strategy === 'create-new') {
      await expect(page.getByRole('heading', { name: 'Edit Schema: Order', exact: true })).toBeVisible()
      await page.getByRole('button', { name: 'Cancel', exact: true }).click()
    }
    await expect(page.getByPlaceholder('UserResponse')).not.toBeVisible()
    const exported = await exportSpecification(page)
    const target = { $ref: `#/components/schemas/${strategy === 'rename-all' ? 'RenamedOrder' : 'Order'}` }
    expect(exported).toHaveProperty(['components', 'schemas', 'RenamedOrder'], model)
    if (strategy === 'rename-all') expect(exported).not.toHaveProperty(['components', 'schemas', 'Order'])
    else expect(exported).toHaveProperty(['components', 'schemas', 'Order'], model)
    expect(exported).toHaveProperty(['components', 'schemas', 'Envelope', 'properties'], {
      order: target, orders: { type: 'array', items: target },
    })
    expect(exported).toHaveProperty(
      ['paths', '/orders', 'post', 'responses', '201', 'content', 'application/json', 'schema'], target,
    )
    test.fail(strategy === 'rename-all', 'Known bug: rename-all does not update schemaRef/ref/itemRef in internal request bodies.')
    expect(exported).toMatchObject({ paths: { '/orders': {
      post: {
        requestBody: { content: { 'application/json': { schema: target } } },
        responses: { '201': { content: { 'application/json': { schema: target } } } },
      },
      put: { requestBody: { content: { 'application/json': { schema: {
        type: 'object', properties: { order: target, orders: { type: 'array', items: target } },
      } } } } },
    } } })
    await reloadSavedSpecification(page, referenceDocument.info.title)
    expect(await exportSpecification(page)).toEqual(exported)
  })
}

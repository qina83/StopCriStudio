import { expect, test } from '@playwright/test'
import { addOperation, createPath, resetAppState } from './helpers/editor'
import { confirmDeletion, saveTreeNode, treeRow } from './helpers/parameterTree'
import { expectPersistedContent, exportSpecification, openOperation, reloadSavedSpecification } from './helpers/specification'

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

  await page.getByLabel('Edit query parameter').click()
  await expect(page.getByPlaceholder('Describe this parameter…')).toHaveValue('Primary query string')
  await page.locator('.fixed.inset-0').last().getByRole('button', { name: 'Cancel', exact: true }).click()
  await page.getByLabel('Delete query parameter').click()
  await page.locator('.fixed.inset-0').last().locator('button').filter({ hasText: /^Delete$/ }).click()
  await expect(page.getByText('No query parameters defined')).toBeVisible()
})

test('preserves nested query siblings while adding, editing, and deleting tree nodes (WP-016, WP-017, WP-021)', async ({ page }) => {
  await createPath(page, '/search')
  await addOperation(page, 'GET')
  await page.getByRole('button', { name: 'Add parameter', exact: true }).first().click()
  await saveTreeNode(page, 'filter', 'object')
  await treeRow(page, 'filter').getByRole('button', { name: 'Expand', exact: true }).click()
  await page.getByRole('button', { name: 'Add property', exact: true }).click()
  await saveTreeNode(page, 'items', 'array', { itemType: 'object' })
  await treeRow(page, 'items').getByRole('button', { name: 'Expand', exact: true }).click()
  await page.getByRole('button', { name: 'Add item property', exact: true }).click()
  await saveTreeNode(page, 'code', 'integer')
  await page.getByRole('button', { name: 'Add item property', exact: true }).click()
  await saveTreeNode(page, 'active', 'boolean')
  await treeRow(page, 'code').getByLabel('Edit query parameter').click()
  await saveTreeNode(page, 'productCode', 'integer')
  await treeRow(page, 'filter').getByLabel('Edit query parameter').click()
  await saveTreeNode(page, 'criteria', 'object')
  await expect(page.getByText('productCode', { exact: true })).toBeVisible()
  await treeRow(page, 'active').getByLabel('Delete query parameter').click()
  await page.locator('.fixed.inset-0').last().getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(page.getByText('active', { exact: true })).toBeVisible()
  await treeRow(page, 'active').getByLabel('Delete query parameter').click()
  await confirmDeletion(page)
  await expect(page.getByText('active', { exact: true })).not.toBeVisible()

  const expected = { paths: { '/search': { get: { parameters: [{
    in: 'query', name: 'criteria',
    schema: { type: 'object', properties: { items: { type: 'array', items: {
      type: 'object', properties: { productCode: { type: 'integer' } },
    } } } },
  }] } } } }
  expect(await exportSpecification(page)).toHaveProperty(['paths', '/search', 'get', 'parameters'], expected.paths['/search'].get.parameters)
  await reloadSavedSpecification(page)
  await openOperation(page, '/search', 'GET')
  expect(await exportSpecification(page)).toHaveProperty(['paths', '/search', 'get', 'parameters'], expected.paths['/search'].get.parameters)
  await treeRow(page, 'criteria').getByLabel('Delete query parameter').click()
  await confirmDeletion(page)
  await expect(page.getByText('No query parameters defined')).toBeVisible()
  expect(await exportSpecification(page)).not.toHaveProperty(['paths', '/search', 'get', 'parameters'])
})

test('validates query names and sibling uniqueness without saving invalid input (WP-014)', async ({ page }) => {
  await createPath(page, '/search')
  await addOperation(page, 'GET')
  await page.getByRole('button', { name: 'Add parameter', exact: true }).first().click()
  const modal = page.locator('.fixed.inset-0').last()
  await modal.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(modal.getByText('Name is required', { exact: true })).toBeVisible()
  await modal.getByPlaceholder('parameterName').fill('9-invalid')
  await modal.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(modal.getByText('Name must start with a letter', { exact: false })).toBeVisible()
  await saveTreeNode(page, 'q')
  await page.getByRole('button', { name: 'Add parameter', exact: true }).click()
  await modal.getByPlaceholder('parameterName').fill('q')
  await modal.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(modal.getByText('A parameter with this name already exists at this level')).toBeVisible()
  await modal.getByRole('button', { name: 'Cancel', exact: true }).click()
  expect(await exportSpecification(page)).toMatchObject({ paths: { '/search': { get: {
    parameters: [{ name: 'q', schema: { type: 'string' } }],
  } } } })
})

for (const example of [
  { type: 'string', value: 'ready', invalid: null, expected: 'ready' },
  { type: 'number', value: '1.25', invalid: 'not-a-number', expected: 1.25 },
  { type: 'integer', value: '0', invalid: '1.5', expected: 0 },
  { type: 'boolean', value: 'false', invalid: 'yes', expected: false },
] as const) {
  test(`validates and exports a ${example.type} default with its original type (WP-014, WP-020)`, async ({ page }) => {
    await createPath(page, '/search')
    await addOperation(page, 'GET')
    await page.getByRole('button', { name: 'Add parameter', exact: true }).first().click()
    const modal = page.locator('.fixed.inset-0').last()
    await modal.getByPlaceholder('parameterName').fill('value')
    await modal.getByRole('combobox').selectOption(example.type)
    const input = modal.getByPlaceholder(
      example.type === 'boolean' ? 'true or false' : example.type === 'integer' ? '0' : 'optional',
      { exact: true },
    ).first()
    if (example.invalid) {
      await input.fill(example.invalid)
      await modal.getByRole('button', { name: 'Save', exact: true }).click()
      await expect(modal.getByText(/^Default value must/)).toBeVisible()
    }
    await input.fill(example.value)
    await modal.getByRole('checkbox', { name: 'Required' }).check()
    await modal.getByPlaceholder('Describe this parameter…').fill('Typed default')
    await modal.getByRole('button', { name: 'Save', exact: true }).click()
    const expected = { paths: { '/search': { get: { parameters: [{
      name: 'value', in: 'query', required: true, description: 'Typed default',
      schema: { type: example.type, default: example.expected },
    }] } } } }
    expect(await exportSpecification(page)).toMatchObject(expected)
    await expectPersistedContent(page, { paths: { '/search': { get: {
      _queryParams: [{ name: 'value', defaultValue: example.value }],
    } } } })
    await reloadSavedSpecification(page)
    expect(await exportSpecification(page)).toMatchObject(expected)
  })
}

test('rejects invalid regex and numeric ranges and exports corrected constraints (WP-014)', async ({ page }) => {
  await createPath(page, '/search')
  await addOperation(page, 'GET')
  await page.getByRole('button', { name: 'Add parameter', exact: true }).first().click()
  const modal = page.locator('.fixed.inset-0').last()
  await modal.getByPlaceholder('parameterName').fill('code')
  await modal.getByPlaceholder('e.g. ^[a-z]+$').fill('[')
  await modal.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(modal.getByText('Invalid regular expression pattern')).toBeVisible()
  await modal.getByPlaceholder('e.g. ^[a-z]+$').fill('^[a-z]+$')
  await modal.getByRole('button', { name: 'Save', exact: true }).click()
  await page.getByRole('button', { name: 'Add parameter', exact: true }).click()
  await modal.getByPlaceholder('parameterName').fill('limit')
  await modal.getByRole('combobox').selectOption('integer')
  await modal.getByRole('spinbutton').nth(0).fill('10')
  await modal.getByRole('spinbutton').nth(1).fill('1')
  await modal.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(modal.getByText('Minimum cannot be greater than maximum')).toBeVisible()
  await modal.getByRole('spinbutton').nth(0).fill('0')
  await modal.getByRole('spinbutton').nth(1).fill('10')
  await modal.getByRole('button', { name: 'Save', exact: true }).click()
  expect(await exportSpecification(page)).toMatchObject({ paths: { '/search': { get: { parameters: [
    { name: 'code', schema: { type: 'string', pattern: '^[a-z]+$' } },
    { name: 'limit', schema: { type: 'integer', minimum: 0, maximum: 10 } },
  ] } } } })
})

test('does not rename a query parameter to an existing sibling name (WP-014)', async ({ page }) => {
  await createPath(page, '/search')
  await addOperation(page, 'GET')
  await page.getByRole('button', { name: 'Add parameter', exact: true }).first().click()
  await saveTreeNode(page, 'first')
  await page.getByRole('button', { name: 'Add parameter', exact: true }).click()
  await saveTreeNode(page, 'second')
  const before = await exportSpecification(page)
  await treeRow(page, 'second').getByLabel('Edit query parameter').click()
  await page.getByPlaceholder('parameterName').fill('first')
  await page.locator('.fixed.inset-0').last().getByRole('button', { name: 'Save', exact: true }).click()
  test.fail(true, 'Known bug: query edit validation excludes the new name rather than the original name from duplicate detection.')
  await expect(page.getByText('A parameter with this name already exists at this level', { exact: true })).toBeVisible()
  await page.locator('.fixed.inset-0').last().getByRole('button', { name: 'Cancel', exact: true }).click()
  expect(await exportSpecification(page)).toEqual(before)
})

test('cancels query edits and removes stale scalar constraints on a type change (WP-014)', async ({ page }) => {
  await createPath(page, '/search')
  await addOperation(page, 'GET')
  await page.getByRole('button', { name: 'Add parameter', exact: true }).first().click()
  const modal = page.locator('.fixed.inset-0').last()
  await modal.getByPlaceholder('parameterName').fill('value')
  await modal.getByPlaceholder('optional', { exact: true }).fill('ready')
  await modal.getByPlaceholder('e.g. ^[a-z]+$').fill('^[a-z]+$')
  await modal.getByRole('button', { name: 'Save', exact: true }).click()
  const before = await exportSpecification(page)
  await treeRow(page, 'value').getByLabel('Edit query parameter').click()
  await modal.getByPlaceholder('parameterName').fill('discarded')
  await modal.getByRole('button', { name: 'Cancel', exact: true }).click()
  expect(await exportSpecification(page)).toEqual(before)
  await treeRow(page, 'value').getByLabel('Edit query parameter').click()
  await modal.getByRole('combobox').selectOption('array')
  await modal.getByRole('combobox').nth(1).selectOption('integer')
  await modal.getByRole('button', { name: 'Save', exact: true }).click()
  expect(await exportSpecification(page)).toHaveProperty(['paths', '/search', 'get', 'parameters'], [
    { in: 'query', name: 'value', schema: { type: 'array', items: { type: 'integer' } } },
  ])
})

test('keeps same-named parameters in separate scopes after deleting an earlier root sibling (WP-021)', async ({ page }) => {
  await createPath(page, '/search')
  await addOperation(page, 'GET')
  await page.getByRole('button', { name: 'Add parameter', exact: true }).first().click()
  await saveTreeNode(page, 'code')
  await page.getByRole('button', { name: 'Add parameter', exact: true }).click()
  await saveTreeNode(page, 'filter', 'object')
  await treeRow(page, 'filter').getByRole('button', { name: 'Expand', exact: true }).click()
  await page.getByRole('button', { name: 'Add property', exact: true }).click()
  await saveTreeNode(page, 'code', 'integer')
  await page.getByLabel('Delete query parameter').first().click()
  await confirmDeletion(page)
  await treeRow(page, 'filter').getByRole('button', { name: 'Expand', exact: true }).click()
  await treeRow(page, 'code').getByLabel('Edit query parameter').click()
  await saveTreeNode(page, 'productCode', 'integer')
  expect(await exportSpecification(page)).toHaveProperty(['paths', '/search', 'get', 'parameters'], [{
    in: 'query', name: 'filter', schema: {
      type: 'object', properties: { productCode: { type: 'integer' } },
    },
  }])
})
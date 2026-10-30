import { expect, test } from '@playwright/test'
import { resetAppState } from './helpers/editor'
import { expectNoInternalKeys, exportSpecification, getPersistedContent, importSpecification, openOperation, reloadSavedSpecification } from './helpers/specification'
import { treeRow } from './helpers/parameterTree'

// Regression contracts for WP-007, WP-020, WP-026, WP-032, WP-035 and WP-046.
const addressSchema = {
  type: 'object',
  properties: { city: { type: 'string' } },
}
const payloadSchema = {
  type: 'object',
  required: ['id', 'lines'],
  properties: {
    id: { type: 'integer', description: 'Order identifier' },
    enabled: { type: 'boolean' },
    amount: { type: 'number' },
    tags: { type: 'array', items: { type: 'string' } },
    metadata: { type: 'object', properties: { source: { type: 'string' } } },
    lines: {
      type: 'array',
      items: {
        type: 'object', required: ['sku'],
        properties: { sku: { type: 'string' }, quantity: { type: 'integer' } },
      },
    },
    address: { $ref: '#/components/schemas/Address' },
    previousAddresses: { type: 'array', items: { $ref: '#/components/schemas/Address' } },
  },
}
const queryParameters = [
  { in: 'query', name: 'q', required: true, description: 'Search', schema: { type: 'string', pattern: '^[a-z]+$', default: 'all' } },
  { in: 'query', name: 'limit', schema: { type: 'integer', minimum: 0, maximum: 100, default: 0 } },
  { in: 'query', name: 'active', schema: { type: 'boolean', default: false } },
  { in: 'query', name: 'ratio', schema: { type: 'number', default: 0.5 } },
  { in: 'query', name: 'filter', schema: { type: 'object', properties: {
    status: { type: 'string' },
    entries: { type: 'array', items: { type: 'object', properties: { code: { type: 'integer' } } } },
  } } },
  { in: 'query', name: 'tags', schema: { type: 'array', items: { type: 'string' } } },
]
const response = { description: 'Order result', content: { 'application/json': { schema: payloadSchema } } }
const document = {
  openapi: '3.0.0',
  info: { title: 'Regression API', version: '2.0.0' },
  paths: {
    '/orders': {
      get: {
        operationId: 'findOrders', summary: '  Find orders  ', description: '  Search orders  ', tags: [' orders ', ''],
        parameters: [...queryParameters, { in: 'header', name: 'X-Trace', schema: { type: 'string' } }],
        security: [{ ApiKeyAuth: [] }],
        responses: { '200': response },
      },
      post: {
        requestBody: { required: true, description: 'Order payload', content: { 'application/json': { schema: payloadSchema } } },
        security: [{ BearerAuth: [] }],
        responses: { '201': response },
      },
      put: {
        requestBody: { required: false, content: { 'application/vnd.orders+json': { schema: { $ref: '#/components/schemas/Order' } } } },
        responses: { '204': { description: 'Updated' } },
      },
      patch: {
        requestBody: { required: true, content: { 'application/json': { schema: payloadSchema } } },
        responses: { default: { description: 'Result' } },
      },
    },
  },
  components: {
    schemas: { Address: addressSchema, Order: payloadSchema },
    securitySchemes: {
      ApiKeyAuth: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
      BearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
  },
}

test.beforeEach(async ({ page }) => {
  await resetAppState(page)
})

for (const format of ['yaml', 'json'] as const) {
  test(`round-trips nested query, body, response and security data from ${format} without internal keys`, async ({ page }) => {
    await importSpecification(page, document, format)
    await openOperation(page, '/orders', 'GET')
    await expect(page.getByText('ApiKeyAuth', { exact: true })).toBeVisible()
    await treeRow(page, 'filter').getByRole('button', { name: 'Expand', exact: true }).click()
    await treeRow(page, 'entries').getByRole('button', { name: 'Expand', exact: true }).click()
    await expect(page.getByText('code', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'POST Active', exact: true }).click()
    await expect(page.getByPlaceholder('Describe the request body…')).toHaveValue('Order payload')
    await expect(page.getByText('BearerAuth', { exact: true })).toBeVisible()
    await treeRow(page, 'lines').getByRole('button', { name: 'Expand', exact: true }).click()
    await expect(page.getByText('sku', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'PUT Active', exact: true }).click()
    await expect(page.getByText('Using schema reference: Order')).toBeVisible()
    await expect(page.getByText('Inline property editing is disabled while using a schema reference.')).toBeVisible()
    const persistedBeforeExport = await getPersistedContent(page)
    const exported = await exportSpecification(page)
    expect(exported).toMatchObject({
      paths: { '/orders': {
        get: {
          operationId: 'findOrders', summary: 'Find orders', description: 'Search orders', tags: ['orders'],
          parameters: document.paths['/orders'].get.parameters,
          security: [{ ApiKeyAuth: [] }], responses: { '200': response },
        },
        post: { requestBody: document.paths['/orders'].post.requestBody, security: [{ BearerAuth: [] }] },
        put: { requestBody: document.paths['/orders'].put.requestBody },
        patch: { requestBody: document.paths['/orders'].patch.requestBody },
      } },
      components: document.components,
    })
    expectNoInternalKeys(exported)
    expect(await getPersistedContent(page)).toEqual(persistedBeforeExport)
    await expect(page.getByText('Using schema reference: Order')).toBeVisible()
    await reloadSavedSpecification(page, document.info.title)
    expect(await exportSpecification(page)).toEqual(exported)
    await page.getByLabel('Back to welcome').click()
    await importSpecification(page, { ...exported, info: document.info })
    expect(await exportSpecification(page)).toEqual(exported)
  })
}

for (const [name, schema] of Object.entries({
  Composition: { oneOf: [{ type: 'string' }, { type: 'integer' }] },
  Scalar: { type: 'string', enum: ['pending', 'ready'] },
  List: { type: 'array', items: { type: 'string' } },
  NestedComposition: { type: 'object', properties: { value: { anyOf: [{ type: 'string' }, { type: 'boolean' }] } } },
})) {
  test(`preserves the read-only ${name} schema and response model on metadata edits (WP-035, WP-046)`, async ({ page }) => {
    const imported = {
      openapi: '3.0.0', info: { title: 'Read-only API', version: '1.0.0' },
      paths: { '/models': { get: { responses: { '200': {
        description: 'Original result',
        content: { 'application/json': { schema, example: { value: 'sample' } } },
      } } } } },
      components: { schemas: { [name]: schema } },
    }
    await importSpecification(page, imported)
    await page.getByRole('button', { name: /^Schemas(?:\s|$)/ }).click()
    await expect(page.getByText('Read only', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Edit', exact: true })).toHaveCount(0)
    await page.getByText('Show raw schema JSON', { exact: true }).click()
    await expect(page.getByText(JSON.stringify(schema, null, 2), { exact: true })).toBeVisible()
    await openOperation(page, '/models', 'GET')
    await page.getByRole('button', { name: 'Edit', exact: true }).click()
    const modal = page.locator('.fixed.inset-0').last()
    await expect(modal.getByText(/Read-only model:/)).toBeVisible()
    await modal.getByPlaceholder('Describe this response').fill('Updated result')
    await modal.getByRole('button', { name: 'Save response', exact: true }).click()
    const exported = await exportSpecification(page)
    expect(exported).toHaveProperty(['components', 'schemas', name], schema)
    expect(exported).toHaveProperty(['paths', '/models', 'get', 'responses', '200'], {
      description: 'Updated result',
      content: { 'application/json': { schema, example: { value: 'sample' } } },
    })
    expectNoInternalKeys(exported)
  })
}

test('normalizes incomplete operation metadata for every supported HTTP method', async ({ page }) => {
  const methods = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options']
  await importSpecification(page, {
    openapi: '3.0.0', info: { title: 'Methods API', version: '1.0.0' },
    paths: { '/orders/{id}': Object.fromEntries(methods.map(method => [method, {
      summary: '   ', description: '  Operation details  ', tags: ['', '  '], responses: {},
    }])) },
  })
  const exported = await exportSpecification(page)
  for (const method of methods) {
    expect(exported).toHaveProperty(['paths', '/orders/{id}', method], {
      operationId: `${method}OrdersById`, description: 'Operation details', tags: ['non-empty'],
      responses: { '200': { description: 'Successful response' } },
    })
  }
  expectNoInternalKeys(exported)
})

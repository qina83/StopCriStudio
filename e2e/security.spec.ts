import { expect, test } from '@playwright/test'
import { addOperation, createPath, resetAppState } from './helpers/editor'
import { exportSpecification, importSpecification, openOperation, reloadSavedSpecification } from './helpers/specification'

test.beforeEach(async ({ page }) => {
  await resetAppState(page)
})

for (const location of ['header', 'query', 'cookie']) {
  test(`persists and exports apiKey security in ${location} (WP-027, WP-032)`, async ({ page }) => {
    await createPath(page, '/orders')
    await addOperation(page, 'GET')
    await page.getByRole('button', { name: '+ Add security' }).click()
    const modal = page.locator('.fixed.inset-0').last()
    await modal.getByPlaceholder('ApiKeyAuth').fill('ApiKeyAuth')
    await modal.getByRole('combobox').nth(1).selectOption(location)
    await modal.getByPlaceholder('X-API-Key').fill('order_key')
    await modal.getByRole('button', { name: 'Save', exact: true }).click()
    const exported = await exportSpecification(page)
    expect(exported).toHaveProperty(['components', 'securitySchemes', 'ApiKeyAuth'], {
      type: 'apiKey', in: location, name: 'order_key',
    })
    expect(exported).toHaveProperty(['paths', '/orders', 'get', 'security'], [{ ApiKeyAuth: [] }])
    await reloadSavedSpecification(page)
    expect(await exportSpecification(page)).toEqual(exported)
  })
}

for (const scheme of ['basic', 'bearer']) {
  test(`exports HTTP ${scheme} security without stale fields from another scheme (WP-028, WP-029, WP-032)`, async ({ page }) => {
    await createPath(page, '/orders')
    await addOperation(page, 'GET')
    await page.getByRole('button', { name: '+ Add security' }).click()
    const modal = page.locator('.fixed.inset-0').last()
    await modal.getByPlaceholder('X-API-Key').fill('discarded-key')
    await modal.getByRole('combobox').first().selectOption('http')
    await modal.getByPlaceholder('BearerAuth').fill('HttpAuth')
    await modal.getByRole('combobox').nth(1).selectOption(scheme)
    if (scheme === 'bearer') await modal.getByPlaceholder('JWT').fill('JWT')
    await modal.getByRole('button', { name: 'Save', exact: true }).click()
    expect(await exportSpecification(page)).toHaveProperty(['components', 'securitySchemes', 'HttpAuth'], {
      type: 'http', scheme, ...(scheme === 'bearer' ? { bearerFormat: 'JWT' } : {}),
    })
  })
}

test('validates security names and key names and rejects duplicate requirements (WP-027, WP-030)', async ({ page }) => {
  await createPath(page, '/orders')
  await addOperation(page, 'GET')
  await page.getByRole('button', { name: '+ Add security' }).click()
  const modal = page.locator('.fixed.inset-0').last()
  await modal.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(modal.getByText(/Name is required$/)).toBeVisible()
  await expect(modal.getByText('Key name is required', { exact: false })).toBeVisible()
  await modal.getByPlaceholder('ApiKeyAuth').fill('invalid-name')
  await modal.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(modal.getByText('Name must start with a letter', { exact: false })).toBeVisible()
  await modal.getByPlaceholder('ApiKeyAuth').fill('KeyAuth')
  await modal.getByPlaceholder('X-API-Key').fill('X-Key')
  await modal.getByRole('button', { name: 'Save', exact: true }).click()
  await page.getByRole('button', { name: '+ Add security' }).click()
  await modal.getByPlaceholder('ApiKeyAuth').fill('KeyAuth')
  await modal.getByPlaceholder('X-API-Key').fill('X-Key')
  await modal.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(modal.getByText('This scheme is already applied to this operation', { exact: false })).toBeVisible()
  await modal.getByRole('button', { name: 'Cancel', exact: true }).click()
  expect(await exportSpecification(page)).toHaveProperty(['paths', '/orders', 'get', 'security'], [{ KeyAuth: [] }])
})

test('retains a shared security scheme until the last operation stops using it (WP-030, WP-032)', async ({ page }) => {
  const scheme = { type: 'apiKey', in: 'header', name: 'X-Key' }
  await importSpecification(page, {
    openapi: '3.0.0', info: { title: 'Shared security API', version: '1.0.0' },
    paths: { '/orders': {
      get: { security: [{ SharedKey: [] }] },
      delete: { security: [{ SharedKey: [] }] },
    } },
    components: { securitySchemes: { SharedKey: scheme } },
  })
  await openOperation(page, '/orders', 'GET')
  await page.getByLabel('Delete SharedKey', { exact: true }).click()
  const exported = await exportSpecification(page)
  expect(exported).toHaveProperty(['components', 'securitySchemes', 'SharedKey'], scheme)
  expect(exported).not.toHaveProperty(['paths', '/orders', 'get', 'security'])
  expect(exported).toHaveProperty(['paths', '/orders', 'delete', 'security'], [{ SharedKey: [] }])
  await page.getByRole('button', { name: 'DELETE Active', exact: true }).click()
  await page.getByLabel('Delete SharedKey', { exact: true }).click()
  expect(await exportSpecification(page)).not.toHaveProperty(['components', 'securitySchemes', 'SharedKey'])
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
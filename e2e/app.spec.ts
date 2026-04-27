import { expect, test } from '@playwright/test'

const STORAGE_KEY = 'stopCriStudio_specifications'
const SPEC_NAME = 'QA Studio API'
const SPEC_VERSION = '2.3.4'
const IMPORTED_SPEC_NAME = 'Imported Petstore'
const IMPORTED_SPEC_VERSION = '2.1.0'

const validOpenAPIYaml = `openapi: 3.0.0
info:
  title: ${IMPORTED_SPEC_NAME}
  version: ${IMPORTED_SPEC_VERSION}
paths: {}
components:
  schemas: {}
`

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate((storageKey) => {
    localStorage.removeItem(storageKey)
    Object.keys(localStorage)
      .filter((key) => key.startsWith(`${storageKey}_`))
      .forEach((key) => localStorage.removeItem(key))
  }, STORAGE_KEY)
  await page.reload()
})

async function openSavedSpecificationCard(page: Parameters<typeof test>[0]['page'], name: string) {
  await page.getByRole('button', { name: 'Load a previously saved specification' }).click()
  const card = page.locator('button').filter({ has: page.getByRole('heading', { name, exact: true }) }).first()
  await expect(card).toBeVisible()
  await card.click()
  return card
}

test('shows the welcome screen entry points', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Stop Cri Studio' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Create a new OpenAPI specification' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Load a previously saved specification' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Load an existing OpenAPI specification file' })).toBeVisible()
  await expect(page.getByText('Offline OpenAPI Workspace')).toBeVisible()
})

test('creates, autosaves, reloads, and deletes a saved specification', async ({ page }) => {
  await page.getByRole('button', { name: 'Create a new OpenAPI specification' }).click()

  await expect(page.getByRole('heading', { name: 'API Information' })).toBeVisible()
  await page.getByLabel('Specification Name').fill(SPEC_NAME)
  await page.getByLabel('Specification Version').fill(SPEC_VERSION)

  await expect(page.getByRole('heading', { name: SPEC_NAME })).toBeVisible()
  await expect(page.getByText(`v${SPEC_VERSION}`)).toBeVisible()

  await expect.poll(async () => {
    return page.evaluate((storageKey) => {
      const items = JSON.parse(localStorage.getItem(storageKey) || '[]') as Array<{ name: string; specVersion: string }>
      return items.some((item) => item.name === 'QA Studio API' && item.specVersion === '2.3.4')
    }, STORAGE_KEY)
  }).toBe(true)

  await page.getByLabel('Back to welcome').click()
  await openSavedSpecificationCard(page, SPEC_NAME)
  await page.getByRole('button', { name: 'Load Specification' }).click()

  await expect(page.getByRole('heading', { name: SPEC_NAME })).toBeVisible()
  await expect(page.getByText(`v${SPEC_VERSION}`)).toBeVisible()

  await page.getByLabel('Back to welcome').click()
  const card = await openSavedSpecificationCard(page, SPEC_NAME)
  await card.getByRole('button', { name: 'Delete' }).click()
  await page.locator('.fixed.inset-0').last().locator('button').filter({ hasText: /^Delete$/ }).click()

  await expect(page.getByText('No saved specifications yet')).toBeVisible()
})

test('shows a validation modal for unsupported imported files', async ({ page }) => {
  await page.locator('input[type="file"]').setInputFiles({
    name: 'invalid.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('not an OpenAPI specification'),
  })

  await expect(page.getByRole('heading', { name: 'Invalid file type' })).toBeVisible()
  await expect(page.getByText('Please select a YAML (.yaml, .yml) or JSON (.json) file.')).toBeVisible()
  await page.locator('button').filter({ hasText: /^Close$/ }).click()
  await expect(page.getByRole('heading', { name: 'Invalid file type' })).not.toBeVisible()
})

test('imports a valid specification file and exports it as yaml', async ({ page }) => {
  await page.locator('input[type="file"]').setInputFiles({
    name: 'petstore.yaml',
    mimeType: 'application/x-yaml',
    buffer: Buffer.from(validOpenAPIYaml),
  })

  await expect(page.getByRole('heading', { name: IMPORTED_SPEC_NAME })).toBeVisible()
  await expect(page.getByText(`v${IMPORTED_SPEC_VERSION}`)).toBeVisible()

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export YAML' }).click()
  const download = await downloadPromise

  await expect(download.suggestedFilename()).toBe('imported-petstore.yaml')
  await page.getByLabel('Back to welcome').click()
  await openSavedSpecificationCard(page, IMPORTED_SPEC_NAME)
  await expect(page.getByRole('button', { name: 'Load Specification' })).toBeEnabled()
})

test('creates paths and schemas and filters them from the sidebar', async ({ page }) => {
  await page.getByRole('button', { name: 'Create a new OpenAPI specification' }).click()

  await page.getByRole('button', { name: 'Paths' }).click()
  await page.getByRole('button', { name: 'Add Path' }).first().click()
  await page.getByPlaceholder('/users').fill('/users')
  await page.getByRole('button', { name: 'Create Path' }).click()

  await expect(page.getByRole('heading', { name: 'Path Workflow' })).toBeVisible()
  await expect(page.getByText('Editing /users')).toBeVisible()
  await page.getByLabel('Close path editor').click()

  await page.getByRole('button', { name: 'Schemas' }).click()
  await page.getByRole('button', { name: 'Add Schema' }).first().click()
  await page.getByPlaceholder('UserResponse').fill('User')
  await page.getByRole('button', { name: 'Save Schema' }).click()

  await expect(page.getByText('Schema saved successfully.')).toBeVisible()

  await page.getByPlaceholder('Filter paths and schemas').fill('User')
  await expect(page.locator('button').filter({ hasText: 'User' }).first()).toBeVisible()
  await page.getByRole('button', { name: 'Clear filter' }).click()
  await expect(page.getByPlaceholder('Filter paths and schemas')).toHaveValue('')
})
import { test, expect, Page } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const STORAGE_KEY = 'stopCriStudio_specifications'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const OUT = path.resolve(__dirname, '..', 'docs', 'screenshots')

async function reset(page: Page) {
  await page.goto('/')
  await page.evaluate((key) => {
    localStorage.removeItem(key)
    Object.keys(localStorage).filter(k => k.startsWith(`${key}_`)).forEach(k => localStorage.removeItem(k))
  }, STORAGE_KEY)
  await page.reload()
}

async function shot(page: Page, name: string) {
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: false })
}

test.describe.configure({ mode: 'serial' })

test('capture all manual screenshots', async ({ page }) => {
  test.setTimeout(180_000)
  await page.setViewportSize({ width: 1440, height: 900 })

  await reset(page)
  await expect(page.getByRole('heading', { name: 'Stop Cri Studio' })).toBeVisible()
  await shot(page, '01-welcome')

  await page.getByRole('button', { name: 'Load a previously saved specification' }).click()
  await expect(page.getByText('No saved specifications yet')).toBeVisible()
  await shot(page, '02-load-modal-empty')
  await page.keyboard.press('Escape')

  await page.getByRole('button', { name: 'Create a new OpenAPI specification' }).click()
  await expect(page.getByRole('heading', { name: 'API Information' })).toBeVisible()
  await shot(page, '03-editor-info-panel')

  await page.getByRole('button', { name: 'Paths' }).click()
  await shot(page, '04-paths-empty')

  await page.getByRole('button', { name: 'Add Path' }).first().click()
  await page.getByPlaceholder('/users').fill('/users/{id}')
  await shot(page, '05-paths-new-form')

  await page.getByRole('button', { name: 'Create Path' }).click()
  await expect(page.getByRole('heading', { name: 'Path Workflow' })).toBeVisible()
  await shot(page, '06-path-edit-form')

  await page.locator('button').filter({ hasText: /^GET/ }).first().click()
  const opModal = page.locator('.fixed.inset-0').last()
  await opModal.locator('button').filter({ hasText: /^Add operation$/ }).click()
  await expect(page.getByRole('button', { name: 'Delete Operation' })).toBeVisible()
  await shot(page, '07-operation-editor-get')

  // Try Add Parameter button (query parameters)
  const addParamBtn = page.getByRole('button', { name: /Add Parameter|Add parameter/i }).first()
  if (await addParamBtn.isVisible().catch(() => false)) {
    await addParamBtn.click()
    const qpModal = page.locator('.fixed.inset-0').last()
    await qpModal.getByPlaceholder('parameterName').fill('q')
    await shot(page, '08-query-parameter-form')
    await qpModal.getByRole('button', { name: /^Save/ }).first().click()
    await page.waitForTimeout(300)
    await shot(page, '09-query-parameters-list')
  }

  await page.getByRole('button', { name: 'Paths' }).click()
  await page.locator('button').filter({ hasText: /\/users\/\{id\}/ }).first().click()
  await page.locator('button').filter({ hasText: /^POST/ }).first().click()
  const opModal2 = page.locator('.fixed.inset-0').last()
  await opModal2.locator('button').filter({ hasText: /^Add operation$/ }).click()
  await expect(page.getByText('POST operation')).toBeVisible()
  await shot(page, '10-operation-editor-post')

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2))
  await shot(page, '11-request-body-panel')

  await page.getByRole('button', { name: 'Add Response' }).first().click()
  const respModal = page.locator('.fixed.inset-0').last()
  await respModal.getByPlaceholder('200 or default').fill('200')
  await respModal.getByPlaceholder('Describe this response').fill('Successful response')
  await shot(page, '12-response-form')
  await respModal.getByRole('button', { name: /^Save/ }).first().click()
  await page.waitForTimeout(300)
  await shot(page, '13-responses-list')

  const addSecBtn = page.getByRole('button', { name: '+ Add security' }).first()
  await addSecBtn.scrollIntoViewIfNeeded().catch(() => {})
  await addSecBtn.click()
  const secModal = page.locator('.fixed.inset-0').last()
  await secModal.getByPlaceholder('ApiKeyAuth').fill('ApiKeyAuth')
  await secModal.getByPlaceholder('X-API-Key').fill('X-API-Key')
  await shot(page, '14-security-form')
  await secModal.getByRole('button', { name: /^Save/ }).first().click()
  await page.waitForTimeout(300)
  await shot(page, '15-security-list')

  await page.getByRole('button', { name: 'Schemas' }).click()
  await shot(page, '16-schemas-empty')
  await page.getByRole('button', { name: 'Add Schema' }).first().click()
  await page.getByPlaceholder('UserResponse').fill('User')
  await shot(page, '17-schema-create-form')
  await page.getByRole('button', { name: 'Save Schema' }).click()
  await page.waitForTimeout(500)
  await shot(page, '18-schema-saved')

  await page.getByPlaceholder('Filter paths and schemas').fill('User')
  await page.waitForTimeout(500)
  await shot(page, '19-sidebar-filter')
})

import { expect, Page } from '@playwright/test'

const STORAGE_KEY = 'stopCriStudio_specifications'

export async function resetAppState(page: Page) {
  await page.goto('/')
  await page.evaluate((storageKey) => {
    localStorage.removeItem(storageKey)
    Object.keys(localStorage)
      .filter((key) => key.startsWith(`${storageKey}_`))
      .forEach((key) => localStorage.removeItem(key))
  }, STORAGE_KEY)
  await page.reload()
}

export async function createPath(page: Page, pathName: string) {
  await page.getByRole('button', { name: 'Create a new OpenAPI specification' }).click()
  await page.getByRole('button', { name: 'Paths' }).click()
  await page.getByRole('button', { name: 'Add Path' }).first().click()
  await page.getByPlaceholder('/users').fill(pathName)
  await page.getByRole('button', { name: 'Create Path' }).click()
  await expect(page.getByRole('heading', { name: 'Path Workflow' })).toBeVisible()
  await expect(page.getByText(`Editing ${pathName}`)).toBeVisible()
}

export async function addOperation(page: Page, method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS') {
  await page.locator('button').filter({ hasText: new RegExp(`^${method}`) }).first().click()
  await page.locator('.fixed.inset-0').last().locator('button').filter({ hasText: /^Add operation$/ }).click()
  await expect(page.getByRole('button', { name: 'Delete Operation' })).toBeVisible()
  await expect(page.getByText(method, { exact: true }).last()).toBeVisible()
}
import { expect, Locator, Page } from '@playwright/test'

type ParameterType = 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array'

export function treeRow(scope: Page | Locator, name: string): Locator {
  return scope.getByText(name, { exact: true }).locator('..')
}

export async function saveTreeNode(
  page: Page,
  name: string,
  type: ParameterType = 'string',
  options: { itemType?: string; required?: boolean; description?: string } = {},
): Promise<void> {
  const modal = page.locator('.fixed.inset-0').last()
  await modal.getByPlaceholder(/^(parameterName|propertyName)$/).fill(name)
  await modal.getByRole('combobox').first().selectOption(type)
  if (options.itemType) await modal.getByRole('combobox').nth(1).selectOption(options.itemType)
  await modal.getByRole('checkbox', { name: 'Required' }).setChecked(options.required ?? false)
  if (options.description) await modal.getByPlaceholder(/Describe this (parameter|property)/).fill(options.description)
  await modal.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(modal.getByPlaceholder(/^(parameterName|propertyName)$/)).not.toBeVisible()
  await expect(page.getByText(name, { exact: true }).last()).toBeVisible()
}

export async function confirmDeletion(page: Page): Promise<void> {
  const modal = page.locator('.fixed.inset-0').last()
  await modal.getByRole('button', { name: 'Delete', exact: true }).click()
  await expect(modal.getByRole('button', { name: 'Delete', exact: true })).not.toBeVisible()
}

import { expect, Page } from '@playwright/test'
import { dump, load } from 'js-yaml'

export async function importSpecification(
  page: Page,
  document: { info: { title: string; version: string }; [key: string]: unknown },
  format: 'json' | 'yaml' = 'yaml',
): Promise<void> {
  await page.locator('input[type="file"]').setInputFiles({
    name: `specification.${format}`,
    mimeType: format === 'json' ? 'application/json' : 'application/x-yaml',
    buffer: Buffer.from(format === 'json' ? JSON.stringify(document) : dump(document)),
  })
  await expect(page.getByRole('heading', { name: document.info.title, exact: true })).toBeVisible()
}

export async function exportSpecification(page: Page): Promise<Record<string, unknown>> {
  const pendingDownload = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export YAML', exact: true }).click()
  const download = await pendingDownload
  expect(await download.failure()).toBeNull()
  const stream = await download.createReadStream()
  if (!stream) throw new Error('The exported YAML download has no readable stream.')
  const chunks: Buffer[] = []
  for await (const chunk of stream) chunks.push(Buffer.from(chunk))
  const document: unknown = load(Buffer.concat(chunks).toString('utf8'))
  if (!document || typeof document !== 'object' || Array.isArray(document)) {
    throw new Error('The exported YAML must contain an OpenAPI object.')
  }
  return document as Record<string, unknown>
}

export async function openOperation(page: Page, pathName: string, method: string): Promise<void> {
  await page.getByRole('button', { name: /^Paths(?:\s|$)/ }).click()
  await page.getByRole('button').filter({ hasText: pathName }).first().click()
  await expect(page.getByText(`Editing ${pathName}`, { exact: true })).toBeVisible()
  await page.getByRole('button', { name: `${method} Active`, exact: true }).click()
  await expect(page.getByRole('button', { name: 'Delete Operation', exact: true })).toBeVisible()
}

export async function reloadSavedSpecification(page: Page, name = 'Untitled API'): Promise<void> {
  await page.reload()
  await page.getByRole('button', { name: 'Load a previously saved specification' }).click()
  await page.getByRole('button').filter({
    has: page.getByRole('heading', { name, exact: true }),
  }).first().click()
  await page.getByRole('button', { name: 'Load Specification', exact: true }).click()
  await expect(page.getByRole('heading', { name, exact: true })).toBeVisible()
}

export async function getPersistedContent(page: Page): Promise<unknown> {
  return page.evaluate(() => {
    const metadata = JSON.parse(localStorage.getItem('stopCriStudio_specifications') ?? '[]') as Array<{ id: string }>
    if (metadata.length !== 1) return null
    const serialized = localStorage.getItem(`stopCriStudio_specifications_${metadata[0].id}`)
    if (!serialized) return null
    const specification = JSON.parse(serialized) as { content: unknown }
    return specification.content
  })
}

export async function expectPersistedContent(page: Page, expected: Record<string, unknown>): Promise<void> {
  await expect.poll(() => getPersistedContent(page)).toMatchObject(expected)
}

export function expectNoInternalKeys(value: unknown): void {
  if (!value || typeof value !== 'object') return
  if (Array.isArray(value)) {
    value.forEach(expectNoInternalKeys)
    return
  }
  for (const [key, child] of Object.entries(value)) {
    expect(key, `Internal key ${key} leaked into exported YAML`).not.toMatch(/^_/)
    expectNoInternalKeys(child)
  }
}

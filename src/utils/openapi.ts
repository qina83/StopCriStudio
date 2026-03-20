import * as YAML from 'js-yaml'
import { OpenAPISpec } from '@/store/specStore'

export async function parseOpenAPIFile(
  file: File,
): Promise<{ spec: OpenAPISpec; errors: string[] }> {
  const content = await file.text()
  const errors: string[] = []

  try {
    let parsed: unknown

    if (file.type === 'application/json' || file.name.endsWith('.json')) {
      parsed = JSON.parse(content)
    } else if (file.type === 'application/yaml' || file.name.match(/\.ya?ml$/)) {
      parsed = YAML.load(content)
    } else {
      // Try both
      try {
        parsed = JSON.parse(content)
      } catch {
        parsed = YAML.load(content)
      }
    }

    // Simple validation - just ensure it has required OpenAPI properties
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid OpenAPI specification: root must be an object')
    }

    const spec = parsed as OpenAPISpec

    // Basic required fields check
    if (!spec.openapi || !spec.info || !spec.paths) {
      throw new Error('Missing required OpenAPI fields: openapi, info, paths')
    }

    return { spec, errors }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    errors.push(errorMsg)
    throw new Error(`Failed to parse OpenAPI file: ${errorMsg}`)
  }
}

export function serializeToJSON(spec: OpenAPISpec): string {
  return JSON.stringify(spec, null, 2)
}

export function serializeToYAML(spec: OpenAPISpec): string {
  return YAML.dump(spec, { indent: 2 })
}

export function downloadFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'application/octet-stream' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function copyToClipboard(text: string): Promise<boolean> {
  return navigator.clipboard
    .writeText(text)
    .then(() => true)
    .catch(() => false)
}

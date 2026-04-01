import { dump } from 'js-yaml'
import { OpenAPISpecification } from '../types'

/**
 * Export specification as YAML file
 * Implements WP-004: Export specification as YAML
 */
export function exportSpecificationAsYAML(specification: OpenAPISpecification): void {
  try {
    const filename = generateFilename(specification.name)
    const yamlContent = dump(specification.content, { lineWidth: -1, noRefs: true })
    const blob = new Blob([yamlContent], { type: 'application/x-yaml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Failed to export specification as YAML:', error)
    throw new Error('Failed to export specification')
  }
}

/**
 * Generate a valid filename for the exported specification
 */
function generateFilename(specName: string): string {
  if (!specName || typeof specName !== 'string' || specName.trim().length === 0) {
    return 'openapi.yaml'
  }
  const sanitized = specName
    .trim()
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
  if (sanitized.length === 0) {
    return 'openapi.yaml'
  }
  return sanitized.endsWith('.yaml') ? sanitized : `${sanitized}.yaml`
}

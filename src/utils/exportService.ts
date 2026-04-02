import { dump } from 'js-yaml'
import { OpenAPISpecification, PathParameter } from '../types'
import { toOpenAPIParameters } from './pathParameterUtils'

/**
 * Export specification as YAML file
 * Implements WP-004: Export specification as YAML
 * Includes WP-006: Path parameters in OpenAPI format
 */
export function exportSpecificationAsYAML(specification: OpenAPISpecification): void {
  try {
    const filename = generateFilename(specification.name)
    // Transform content to proper OpenAPI format
    const transformedContent = transformForExport(specification.content)
    const yamlContent = dump(transformedContent, { lineWidth: -1, noRefs: true })
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
 * Transform specification content for export
 * Converts internal path parameters format to OpenAPI format
 * WP-006: Ensures path parameters are included in all operations
 */
function transformForExport(content: Record<string, any>): Record<string, any> {
  const transformed = JSON.parse(JSON.stringify(content)) // Deep clone

  if (transformed.paths && typeof transformed.paths === 'object') {
    Object.keys(transformed.paths).forEach((pathName) => {
      const pathObj = transformed.paths[pathName]

      // Extract path parameters from the internal format
      const pathParameters = pathObj.parameters as PathParameter[] | undefined
      const openAPIParameters = pathParameters ? toOpenAPIParameters(pathParameters) : []

      // Add parameters to each operation
      const httpMethods = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options']
      httpMethods.forEach((method) => {
        if (pathObj[method]) {
          const operation = pathObj[method]
          // Merge path parameters with operation parameters
          const existingParams = operation.parameters || []
          const allParams = [
            ...openAPIParameters,
            ...existingParams.filter(
              (p: any) => !openAPIParameters.some((pp) => pp.name === p.name && pp.in === 'path')
            ),
          ]
          if (allParams.length > 0) {
            operation.parameters = allParams
          }
        }
      })

      // Remove the internal parameters property before export
      delete pathObj.parameters
    })
  }

  return transformed
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

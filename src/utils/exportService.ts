import { dump } from 'js-yaml'
import { OpenAPISpecification, PathParameter, QueryParameter, ObjectQueryParameter, ArrayQueryParameter, ScalarQueryParameter, RequestBody, BODY_ELIGIBLE_METHODS, HTTPMethod, SecurityScheme, SecuritySchemeApiKey, SecuritySchemeHttp, OperationSecurityRequirement } from '../types'
import { toOpenAPIParameters } from './pathParameterUtils'
import { buildObjectSchemaFromProperties } from './schemaUtils'

/**
 * Export specification as YAML file
 * Implements WP-004: Export specification as YAML
 * Includes WP-006: Path parameters in OpenAPI format
 * Includes WP-020: Query parameters in OpenAPI format
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
 * WP-020: Exports query parameters per operation
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

          // Build query parameters from internal _queryParams (WP-020)
          const queryParams: QueryParameter[] = operation._queryParams || []
          const openAPIQueryParams = queryParams.map(queryParamToOpenAPI)

          // Merge path parameters with query parameters (path params first)
          const existingParams = operation.parameters || []
          const allParams = [
            ...openAPIParameters,
            ...openAPIQueryParams,
            ...existingParams.filter(
              (p: any) =>
                !openAPIParameters.some((pp) => pp.name === p.name && pp.in === 'path') &&
                !openAPIQueryParams.some((qp) => qp.name === p.name && qp.in === 'query')
            ),
          ]
          if (allParams.length > 0) {
            operation.parameters = allParams
          }

          // Remove internal _queryParams property before export
          delete operation._queryParams

          // WP-026: Export request body for eligible methods
          const methodUpper = method.toUpperCase() as HTTPMethod
          if (BODY_ELIGIBLE_METHODS.includes(methodUpper)) {
            const requestBody: RequestBody | undefined = operation._requestBody
            if (requestBody) {
              operation.requestBody = buildRequestBodyExport(requestBody)
            }
          }
          // Always remove internal _requestBody
          delete operation._requestBody

          // WP-032: Export security requirements
          const securityReqs: OperationSecurityRequirement[] = operation._security || []
          if (securityReqs.length > 0) {
            operation.security = securityReqs.map((req: OperationSecurityRequirement) => ({
              [req.schemeName]: [],
            }))
          }
          // Always remove internal _security
          delete operation._security
        }
      })

      // Remove the internal parameters property before export
      delete pathObj.parameters
    })
  }

  // WP-032: Export components.securitySchemes
  if (transformed.components && typeof transformed.components === 'object') {
    const schemes = transformed.components.securitySchemes as Record<string, SecurityScheme> | undefined
    if (schemes && Object.keys(schemes).length > 0) {
      transformed.components.securitySchemes = buildSecuritySchemesExport(schemes)
    }
  }

  return transformed
}

// ─── Security schemes → OpenAPI (WP-032) ─────────────────────────────────────

function buildSecuritySchemesExport(
  schemes: Record<string, SecurityScheme>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [name, scheme] of Object.entries(schemes)) {
    if (scheme.type === 'apiKey') {
      const s = scheme as SecuritySchemeApiKey
      result[name] = { type: 'apiKey', in: s.in, name: s.name }
    } else if (scheme.type === 'http') {
      const s = scheme as SecuritySchemeHttp
      const entry: Record<string, unknown> = { type: 'http', scheme: s.scheme }
      if (s.bearerFormat) entry.bearerFormat = s.bearerFormat
      result[name] = entry
    } else {
      // Preserve unsupported types as-is
      result[name] = scheme
    }
  }
  return result
}

// ─── Request body → OpenAPI requestBody (WP-026) ─────────────────────────────

function buildRequestBodyExport(body: RequestBody): Record<string, unknown> {
  const schema = buildObjectSchemaFromProperties(body.properties)

  const result: Record<string, unknown> = {
    required: body.required,
    content: {
      [body.mediaType]: { schema },
    },
  }

  if (body.description && body.description.trim()) {
    result.description = body.description.trim()
  }

  return result
}

// ─── Query parameter → OpenAPI schema (WP-020) ────────────────────────────────

function buildQueryParamSchema(param: QueryParameter): Record<string, unknown> {
  if (param.type === 'object') {
    const op = param as ObjectQueryParameter
    const properties: Record<string, unknown> = {}
    for (const prop of op.properties) {
      properties[prop.name] = buildQueryParamSchema(prop)
    }
    return Object.keys(properties).length > 0 ? { type: 'object', properties } : { type: 'object' }
  }

  if (param.type === 'array') {
    const ap = param as ArrayQueryParameter
    let items: Record<string, unknown>
    if (ap.itemType === 'object') {
      const itemProperties: Record<string, unknown> = {}
      for (const prop of ap.itemProperties ?? []) {
        itemProperties[prop.name] = buildQueryParamSchema(prop)
      }
      items = Object.keys(itemProperties).length > 0 ? { type: 'object', properties: itemProperties } : { type: 'object' }
    } else {
      items = { type: ap.itemType }
    }
    return { type: 'array', items }
  }

  // Scalar
  const sp = param as ScalarQueryParameter
  const schema: Record<string, unknown> = { type: sp.type }
  if (sp.pattern) schema.pattern = sp.pattern
  if (sp.minimum !== undefined) schema.minimum = sp.minimum
  if (sp.maximum !== undefined) schema.maximum = sp.maximum
  if (sp.defaultValue !== undefined && sp.defaultValue !== '') {
    if (sp.type === 'number' || sp.type === 'integer') {
      const n = Number(sp.defaultValue)
      if (!isNaN(n)) schema.default = n
    } else if (sp.type === 'boolean') {
      schema.default = sp.defaultValue === 'true'
    } else {
      schema.default = sp.defaultValue
    }
  }
  return schema
}

function queryParamToOpenAPI(param: QueryParameter): Record<string, unknown> {
  return {
    in: 'query',
    name: param.name,
    ...(param.required ? { required: true } : {}),
    ...(param.description ? { description: param.description } : {}),
    schema: buildQueryParamSchema(param),
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

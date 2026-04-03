/**
 * OpenAPI File Loader Utility
 * Handles loading and validating YAML/JSON OpenAPI specification files
 * Implements WP-007
 */

import YAML from 'js-yaml'
import { OpenAPISpecification, QueryParameter, ScalarQueryParameter, ObjectQueryParameter, ArrayQueryParameter, QueryParamScalarType, QueryParamItemType } from '../types'

export interface ValidationError {
  field: string
  message: string
}

export interface LoadResult {
  success: boolean
  spec?: OpenAPISpecification
  errors?: ValidationError[]
}

/**
 * Parse a file content as YAML or JSON
 */
function parseFileContent(content: string): unknown {
  // Try JSON first
  try {
    return JSON.parse(content)
  } catch {
    // Fall back to YAML
    try {
      return YAML.load(content)
    } catch (error) {
      throw new Error(`Invalid file format: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}

/**
 * Validate OpenAPI specification content
 */
function validateOpenAPIContent(content: unknown): { valid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = []

  if (typeof content !== 'object' || content === null) {
    return {
      valid: false,
      errors: [{ field: 'root', message: 'Specification must be an object' }],
    }
  }

  const spec = content as Record<string, unknown>

  // Check OpenAPI version
  if (!spec.openapi || typeof spec.openapi !== 'string') {
    errors.push({
      field: 'openapi',
      message: 'Missing required field "openapi" (must be a string version)',
    })
  } else {
    const version = spec.openapi as string
    const isValidVersion = /^3\.(0|1)\.\d+$/.test(version)
    if (!isValidVersion) {
      errors.push({
        field: 'openapi',
        message: `OpenAPI version "${version}" is not supported. Only 3.0.x and 3.1.x are supported.`,
      })
    }
  }

  // Check info object
  if (!spec.info || typeof spec.info !== 'object') {
    errors.push({
      field: 'info',
      message: 'Missing required field "info" (must be an object)',
    })
  } else {
    const info = spec.info as Record<string, unknown>

    // Check info.title
    if (!info.title || typeof info.title !== 'string') {
      errors.push({
        field: 'info.title',
        message: 'Missing required field "info.title" (must be a string)',
      })
    }

    // Check info.version
    if (!info.version || typeof info.version !== 'string') {
      errors.push({
        field: 'info.version',
        message: 'Missing required field "info.version" (must be a string)',
      })
    }
  }

  // Check paths object
  if (!spec.paths || typeof spec.paths !== 'object') {
    errors.push({
      field: 'paths',
      message: 'Missing required field "paths" (must be an object)',
    })
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Load and validate an OpenAPI specification file
 */
export function loadOpenAPIFile(fileContent: string, fileName: string): LoadResult {
  try {
    // Parse the file content
    const content = parseFileContent(fileContent)

    // Validate the OpenAPI specification
    const validation = validateOpenAPIContent(content)
    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors,
      }
    }

    const spec = content as Record<string, unknown>
    const info = spec.info as Record<string, unknown>

    // Extract version from OpenAPI string
    const openAPIVersion = (spec.openapi as string).match(/^3\.(0|1)/)?.[0] || '3.0'

    // Create the specification object
    const now = Date.now()
    const specName = (info.title as string) || fileName.replace(/\.(yaml|yml|json)$/, '')
    const id = `spec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Convert OpenAPI query parameters to internal format (WP-011/WP-019)
    const transformedContent = importQueryParameters(spec)

    const specification: OpenAPISpecification = {
      id,
      name: specName,
      specVersion: (info.version as string) || '1.0.0',
      openAPIVersion: openAPIVersion as '3.0.0',
      createdAt: now,
      updatedAt: now,
      content: transformedContent,
    }

    return {
      success: true,
      spec: specification,
    }
  } catch (error) {
    return {
      success: false,
      errors: [
        {
          field: 'file',
          message: `Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
    }
  }
}

// ─── Import: OpenAPI → internal _queryParams (WP-011/WP-019) ─────────────────

const SCALAR_TYPES = new Set<string>(['string', 'number', 'integer', 'boolean'])
const HTTP_METHODS = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options']

/**
 * Walk all operations and move `in: "query"` parameters into `_queryParams`.
 * Leaves `in: "path"` parameters in the `parameters` array unchanged.
 */
function importQueryParameters(content: Record<string, any>): Record<string, any> {
  const result = JSON.parse(JSON.stringify(content)) as Record<string, any>

  if (!result.paths || typeof result.paths !== 'object') return result

  for (const pathName of Object.keys(result.paths)) {
    const pathObj = result.paths[pathName]
    for (const method of HTTP_METHODS) {
      const operation = pathObj[method]
      if (!operation || typeof operation !== 'object') continue

      const params: any[] = Array.isArray(operation.parameters) ? operation.parameters : []
      const queryParams = params.filter((p: any) => p.in === 'query')
      const nonQueryParams = params.filter((p: any) => p.in !== 'query')

      if (queryParams.length > 0) {
        operation._queryParams = queryParams.map(openAPIParamToInternal)
        if (nonQueryParams.length > 0) {
          operation.parameters = nonQueryParams
        } else {
          delete operation.parameters
        }
      }
    }
  }

  return result
}

function openAPIParamToInternal(param: any): QueryParameter {
  const schema = param.schema || {}
  return openAPISchemaToQueryParam(
    param.name ?? 'param',
    schema,
    param.required === true,
    typeof param.description === 'string' ? param.description : undefined,
  )
}

function openAPISchemaToQueryParam(
  name: string,
  schema: any,
  required: boolean,
  description: string | undefined,
): QueryParameter {
  const type = schema.type ?? 'string'

  if (type === 'object') {
    const properties: QueryParameter[] = []
    if (schema.properties && typeof schema.properties === 'object') {
      for (const [propName, propSchema] of Object.entries(schema.properties)) {
        properties.push(openAPISchemaToQueryParam(propName, propSchema as any, false, undefined))
      }
    }
    return {
      name, type: 'object',
      ...(required ? { required } : {}),
      ...(description ? { description } : {}),
      properties,
    } as ObjectQueryParameter
  }

  if (type === 'array') {
    const items = schema.items || {}
    const itemType: QueryParamItemType = SCALAR_TYPES.has(items.type)
      ? (items.type as QueryParamItemType)
      : items.type === 'object' ? 'object' : 'string'

    const itemProperties: QueryParameter[] = []
    if (itemType === 'object' && items.properties && typeof items.properties === 'object') {
      for (const [propName, propSchema] of Object.entries(items.properties)) {
        itemProperties.push(openAPISchemaToQueryParam(propName, propSchema as any, false, undefined))
      }
    }

    return {
      name, type: 'array', itemType,
      ...(required ? { required } : {}),
      ...(description ? { description } : {}),
      ...(itemType === 'object' && itemProperties.length > 0 ? { itemProperties } : {}),
    } as ArrayQueryParameter
  }

  // Scalar
  const scalarType: QueryParamScalarType = SCALAR_TYPES.has(type) ? (type as QueryParamScalarType) : 'string'
  const sp: ScalarQueryParameter = {
    name, type: scalarType,
    ...(required ? { required } : {}),
    ...(description ? { description } : {}),
  }
  if (typeof schema.pattern === 'string') sp.pattern = schema.pattern
  if (typeof schema.minimum === 'number') sp.minimum = schema.minimum
  if (typeof schema.maximum === 'number') sp.maximum = schema.maximum
  if (schema.default !== undefined && schema.default !== null) {
    sp.defaultValue = String(schema.default)
  }
  return sp
}

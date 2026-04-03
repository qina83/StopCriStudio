/**
 * OpenAPI File Loader Utility
 * Handles loading and validating YAML/JSON OpenAPI specification files
 * Implements WP-007
 */

import YAML from 'js-yaml'
import { OpenAPISpecification } from '../types'

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

    const specification: OpenAPISpecification = {
      id,
      name: specName,
      specVersion: (info.version as string) || '1.0.0',
      openAPIVersion: openAPIVersion as '3.0.0',
      createdAt: now,
      updatedAt: now,
      content: spec,
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

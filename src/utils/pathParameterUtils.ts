/**
 * Path Parameter Utilities
 * Handles extraction, validation, and formatting of path parameters (WP-006)
 */

import { PathParameter, ParameterType } from '../types'

/**
 * Extracts parameter names from a path string
 * Looks for patterns like {paramName} in the path
 * Returns array of parameter names in order they appear
 */
export function extractParameterNames(path: string): string[] {
  const regex = /{([^}]+)}/g
  const matches: string[] = []
  let match

  while ((match = regex.exec(path)) !== null) {
    matches.push(match[1])
  }

  return matches
}

/**
 * Validates a path string for correct parameter syntax
 * Rules:
 * - Parameters must be enclosed in curly braces {paramName}
 * - Multiple parameters must be separated by path segments
 * - Invalid: /user/{id}{name} (adjacent parameters)
 * - Valid: /user/{id}/name, /user/{id}/{name}
 */
export function validatePathFormat(path: string): { valid: boolean; error?: string } {
  if (!path || !path.startsWith('/')) {
    return { valid: true } // Let other validation handle this
  }

  // Check for adjacent parameters (e.g., {id}{name})
  const adjacentParamsRegex = /}\s*{/
  if (adjacentParamsRegex.test(path)) {
    return {
      valid: false,
      error: 'Adjacent parameters are not allowed. Separate them with path segments (e.g., /users/{id}/posts/{postId})',
    }
  }

  // Check for unmatched braces
  const openBraces = (path.match(/{/g) || []).length
  const closeBraces = (path.match(/}/g) || []).length
  if (openBraces !== closeBraces) {
    return {
      valid: false,
      error: 'Unmatched braces in path. All parameters must have opening and closing braces.',
    }
  }

  // Check for parameters with invalid characters
  const paramRegex = /{([^}]+)}/g
  let match
  while ((match = paramRegex.exec(path)) !== null) {
    const paramName = match[1]
    if (!isValidParameterName(paramName)) {
      return {
        valid: false,
        error: `Invalid parameter name "${paramName}". Parameter names must contain only letters, numbers, and underscores.`,
      }
    }
  }

  return { valid: true }
}

/**
 * Validates a single parameter name
 * Allows: alphanumeric and underscores
 */
export function isValidParameterName(name: string): boolean {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)
}

/**
 * Syncs path parameters with actual placeholders in the path
 * - Adds new parameters for newly added placeholders
 * - Removes parameters for deleted placeholders
 * - Maintains existing parameter types and descriptions
 * - Returns updated parameters array
 */
export function syncParametersWithPath(
  path: string,
  existingParameters: PathParameter[]
): PathParameter[] {
  const parameterNames = extractParameterNames(path)
  const parametersMap = new Map(existingParameters.map((p) => [p.name, p]))

  // Create new parameters array with parameters in path order
  const synced: PathParameter[] = parameterNames.map((name) => {
    // If parameter already exists, keep it; otherwise create new one
    if (parametersMap.has(name)) {
      return parametersMap.get(name)!
    } else {
      return {
        name,
        type: 'string' as ParameterType, // Default type
        description: '',
      }
    }
  })

  return synced
}

/**
 * Checks if all parameters have descriptions or are required
 * Path parameters are always required in OpenAPI
 */
export function validateParametersComplete(parameters: PathParameter[]): boolean {
  return parameters.every((param) => param.name && param.type)
}

/**
 * Converts PathParameter[] to OpenAPI parameters format
 * Each parameter is marked as required: true (path parameters are always required)
 */
export function toOpenAPIParameters(parameters: PathParameter[]): Record<string, any>[] {
  return parameters.map((param) => ({
    name: param.name,
    in: 'path',
    required: true,
    schema: {
      type: param.type,
      ...(param.description && { description: param.description }),
    },
    ...(param.description && { description: param.description }),
  }))
}

/**
 * Detects duplicate parameter names in array
 * Returns array of duplicate names (if any)
 */
export function findDuplicateParameterNames(parameters: PathParameter[]): string[] {
  const seen = new Set<string>()
  const duplicates = new Set<string>()

  parameters.forEach((param) => {
    if (seen.has(param.name)) {
      duplicates.add(param.name)
    }
    seen.add(param.name)
  })

  return Array.from(duplicates)
}

/**
 * Checks if there are orphaned parameters (in parameters array but not in path)
 */
export function findOrphanedParameters(path: string, parameters: PathParameter[]): string[] {
  const parameterNames = new Set(extractParameterNames(path))
  return parameters
    .filter((param) => !parameterNames.has(param.name))
    .map((param) => param.name)
}

/**
 * Validation utilities for OpenAPI specifications
 */

import { PathParameter } from '../types'

export function isValidSpecName(name: string): boolean {
  return name.trim().length > 0 && name.trim().length <= 255
}

export function isValidJSON(jsonString: string): boolean {
  try {
    JSON.parse(jsonString)
    return true
  } catch {
    return false
  }
}

export function validateOpenAPISpec(spec: unknown): boolean {
  if (typeof spec !== 'object' || spec === null) return false

  const obj = spec as Record<string, unknown>
  return typeof obj.openapi === 'string' && typeof obj.info === 'object'
}

/**
 * Validates path parameters
 * WP-006: Ensures all path parameters have required fields
 */
export function validatePathParameters(parameters: PathParameter[]): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  parameters.forEach((param, index) => {
    if (!param.name) {
      errors.push(`Parameter ${index + 1}: Parameter name is required`)
    }
    if (!param.type) {
      errors.push(`Parameter "${param.name}": Parameter type is required`)
    }
  })

  return {
    valid: errors.length === 0,
    errors,
  }
}

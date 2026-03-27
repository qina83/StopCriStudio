/**
 * Validation utilities for OpenAPI specifications
 */

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

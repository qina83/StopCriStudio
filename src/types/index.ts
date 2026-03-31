/**
 * OpenAPI version types - fixed at 3.0 for this editor
 */
export type OpenAPIVersion = '3.0.0'

/**
 * Specification metadata
 */
export interface SpecificationMetadata {
  id: string
  name: string
  specVersion: string // e.g., '1.0.0' - the API/specification version
  createdAt: number
  updatedAt: number
  description?: string
}

/**
 * HTTP method types for operations
 */
export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'

/**
 * API Path Operation
 */
export interface PathOperation {
  description?: string
  summary?: string
  tags?: string[]
  parameters?: unknown[]
  requestBody?: unknown
  responses?: Record<string, unknown>
}

/**
 * API Path with operations
 */
export interface APIPath {
  pathName: string
  operations: Record<HTTPMethod, PathOperation | undefined>
}

/**
 * OpenAPI Specification structure (minimal)
 */
export interface OpenAPISpecification extends SpecificationMetadata {
  openAPIVersion: OpenAPIVersion // Fixed at 3.0.0
  content: Record<string, unknown> // Full OpenAPI spec content
}

/**
 * Application state types
 */
export interface AppState {
  currentSpecification: OpenAPISpecification | null
  specifications: SpecificationMetadata[]
  isLoading: boolean
  error: string | null
}

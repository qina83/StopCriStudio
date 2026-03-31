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

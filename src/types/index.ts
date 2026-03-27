/**
 * OpenAPI version types
 */
export type OpenAPIVersion = '3.0' | '3.1'

/**
 * Specification metadata
 */
export interface SpecificationMetadata {
  id: string
  name: string
  version: OpenAPIVersion
  createdAt: number
  updatedAt: number
  description?: string
}

/**
 * OpenAPI Specification structure (minimal)
 */
export interface OpenAPISpecification extends SpecificationMetadata {
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

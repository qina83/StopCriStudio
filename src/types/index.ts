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
 * Path Parameter types - OpenAPI base parameter types
 */
export type ParameterType = 'string' | 'number' | 'integer' | 'boolean'

/**
 * Path Parameter definition (WP-006)
 */
export interface PathParameter {
  name: string
  type: ParameterType
  description?: string
}

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
  parameters?: PathParameter[]
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

// ─── Query Parameter Types (WP-011, WP-014, WP-016, WP-017) ───────────────────

export type QueryParamScalarType = 'string' | 'number' | 'integer' | 'boolean'
export type QueryParamItemType = 'string' | 'number' | 'integer' | 'boolean' | 'object'
export type QueryParamType = QueryParamScalarType | 'object' | 'array'

export interface QueryParameterBase {
  name: string
  required?: boolean
  description?: string
}

export interface ScalarQueryParameter extends QueryParameterBase {
  type: QueryParamScalarType
  defaultValue?: string
  pattern?: string
  minimum?: number
  maximum?: number
}

export interface ObjectQueryParameter extends QueryParameterBase {
  type: 'object'
  properties: QueryParameter[]
}

export interface ArrayQueryParameter extends QueryParameterBase {
  type: 'array'
  itemType: QueryParamItemType
  itemProperties?: QueryParameter[]
}

export type QueryParameter = ScalarQueryParameter | ObjectQueryParameter | ArrayQueryParameter

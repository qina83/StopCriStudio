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

// ─── Request Body Types (WP-022, WP-023, WP-024, WP-025) ─────────────────────

export const BODY_ELIGIBLE_METHODS: HTTPMethod[] = ['PUT', 'POST', 'PATCH']

export const MEDIA_TYPE_OPTIONS = [
  'application/json',
  'application/x-www-form-urlencoded',
  'multipart/form-data',
  'text/plain',
  'application/octet-stream',
] as const

export type BodyParamScalarType = 'string' | 'number' | 'integer' | 'boolean'
export type BodyParamItemType = 'string' | 'number' | 'integer' | 'boolean' | 'object'
export type BodyParamType = BodyParamScalarType | 'object' | 'array'

export interface BodyParameterBase {
  name: string
  required?: boolean
  description?: string
}

export interface ScalarBodyParameter extends BodyParameterBase {
  type: BodyParamScalarType
}

export interface ObjectBodyParameter extends BodyParameterBase {
  type: 'object'
  properties: BodyParameter[]
}

export interface ArrayBodyParameter extends BodyParameterBase {
  type: 'array'
  itemType: BodyParamItemType
  itemProperties?: BodyParameter[]
}

export type BodyParameter = ScalarBodyParameter | ObjectBodyParameter | ArrayBodyParameter

export interface RequestBody {
  description?: string
  required: boolean
  mediaType: string
  properties: BodyParameter[]
}

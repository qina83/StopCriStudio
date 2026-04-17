import {
  BodyParameter,
  ObjectBodyParameter,
  ArrayBodyParameter,
  ScalarBodyParameter,
  BodyParamScalarType,
  BodyParamItemType,
  OpenAPISpecification,
  HTTPMethod,
  RequestBody,
} from '../types'

const SCALAR_TYPES = new Set<string>(['string', 'number', 'integer', 'boolean'])
const HTTP_METHODS: HTTPMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']

export interface ParsedSchema {
  editable: boolean
  properties: BodyParameter[]
  reason?: string
}

export interface SchemaUsageOperation {
  method: HTTPMethod
  path: string
}

export function isValidSchemaName(name: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(name.trim())
}

export function buildSchemaRef(name: string): string {
  return `#/components/schemas/${name}`
}

export function getSchemaNameFromRef(ref: string): string | null {
  const match = ref.match(/^#\/components\/schemas\/([^/]+)$/)
  return match?.[1] ?? null
}

function parseBodyParamFromSchema(name: string, schema: any, required: boolean): BodyParameter {
  if (!schema || typeof schema !== 'object') {
    return { name, type: 'string', ...(required ? { required: true } : {}) } as ScalarBodyParameter
  }

  if (typeof schema.$ref === 'string') {
    return {
      name,
      type: 'object',
      ref: schema.$ref,
      properties: [],
      ...(required ? { required: true } : {}),
    } as ObjectBodyParameter
  }

  if (schema.oneOf || schema.anyOf || schema.allOf) {
    throw new Error('Unsupported schema composition (oneOf/anyOf/allOf)')
  }

  const type = schema.type ?? (schema.properties ? 'object' : 'string')

  if (type === 'object') {
    const properties: BodyParameter[] = []
    const requiredFields: string[] = Array.isArray(schema.required) ? schema.required : []
    if (schema.properties && typeof schema.properties === 'object') {
      for (const [propName, propSchema] of Object.entries(schema.properties)) {
        properties.push(
          parseBodyParamFromSchema(propName, propSchema as any, requiredFields.includes(propName)),
        )
      }
    }

    return {
      name,
      type: 'object',
      properties,
      ...(required ? { required: true } : {}),
      ...(typeof schema.description === 'string' ? { description: schema.description } : {}),
    } as ObjectBodyParameter
  }

  if (type === 'array') {
    const items = schema.items || {}
    const itemType: BodyParamItemType = SCALAR_TYPES.has(items.type)
      ? (items.type as BodyParamItemType)
      : 'object'

    const itemProperties: BodyParameter[] = []
    if (itemType === 'object' && items.properties && typeof items.properties === 'object') {
      const requiredFields: string[] = Array.isArray(items.required) ? items.required : []
      for (const [propName, propSchema] of Object.entries(items.properties)) {
        itemProperties.push(
          parseBodyParamFromSchema(propName, propSchema as any, requiredFields.includes(propName)),
        )
      }
    }

    return {
      name,
      type: 'array',
      itemType,
      ...(required ? { required: true } : {}),
      ...(typeof schema.description === 'string' ? { description: schema.description } : {}),
      ...(itemType === 'object' ? { itemProperties } : {}),
    } as ArrayBodyParameter
  }

  const scalarType: BodyParamScalarType = SCALAR_TYPES.has(type) ? (type as BodyParamScalarType) : 'string'
  return {
    name,
    type: scalarType,
    ...(required ? { required: true } : {}),
    ...(typeof schema.description === 'string' ? { description: schema.description } : {}),
  } as ScalarBodyParameter
}

export function parseEditableObjectSchema(schema: unknown): ParsedSchema {
  if (!schema || typeof schema !== 'object') {
    return { editable: false, properties: [], reason: 'Schema is not an object value.' }
  }

  const s = schema as Record<string, any>
  if (s.oneOf || s.anyOf || s.allOf) {
    return {
      editable: false,
      properties: [],
      reason: 'Uses oneOf/anyOf/allOf, which is not supported by the visual editor.',
    }
  }

  const topType = s.type ?? (s.properties ? 'object' : undefined)
  if (topType !== 'object') {
    return {
      editable: false,
      properties: [],
      reason: 'Top-level schema must be type: object for visual editing.',
    }
  }

  const properties: BodyParameter[] = []
  const requiredFields: string[] = Array.isArray(s.required) ? s.required : []

  try {
    if (s.properties && typeof s.properties === 'object') {
      for (const [propName, propSchema] of Object.entries(s.properties)) {
        properties.push(
          parseBodyParamFromSchema(propName, propSchema as any, requiredFields.includes(propName)),
        )
      }
    }
  } catch (error) {
    return {
      editable: false,
      properties: [],
      reason: error instanceof Error ? error.message : 'Unsupported schema structure.',
    }
  }

  return { editable: true, properties }
}

function buildSchemaFromBodyParam(param: BodyParameter): Record<string, unknown> {
  if (param.type === 'object') {
    const op = param as ObjectBodyParameter
    if (op.ref) return { $ref: op.ref }

    const properties: Record<string, unknown> = {}
    const required: string[] = []
    for (const child of op.properties) {
      properties[child.name] = buildSchemaFromBodyParam(child)
      if (child.required) required.push(child.name)
    }

    const result: Record<string, unknown> = { type: 'object' }
    if (Object.keys(properties).length > 0) result.properties = properties
    if (required.length > 0) result.required = required
    if (param.description) result.description = param.description
    return result
  }

  if (param.type === 'array') {
    const ap = param as ArrayBodyParameter
    let items: Record<string, unknown>
    if (ap.itemType === 'object') {
      const itemProperties: Record<string, unknown> = {}
      const itemRequired: string[] = []
      for (const child of ap.itemProperties ?? []) {
        itemProperties[child.name] = buildSchemaFromBodyParam(child)
        if (child.required) itemRequired.push(child.name)
      }
      items = { type: 'object' }
      if (Object.keys(itemProperties).length > 0) items.properties = itemProperties
      if (itemRequired.length > 0) items.required = itemRequired
    } else {
      items = { type: ap.itemType }
    }

    const result: Record<string, unknown> = { type: 'array', items }
    if (param.description) result.description = param.description
    return result
  }

  const sp = param as ScalarBodyParameter
  const result: Record<string, unknown> = { type: sp.type }
  if (sp.description) result.description = sp.description
  return result
}

export function buildObjectSchemaFromProperties(properties: BodyParameter[]): Record<string, unknown> {
  const schemaProps: Record<string, unknown> = {}
  const required: string[] = []

  for (const prop of properties) {
    schemaProps[prop.name] = buildSchemaFromBodyParam(prop)
    if (prop.required) required.push(prop.name)
  }

  const result: Record<string, unknown> = { type: 'object' }
  if (Object.keys(schemaProps).length > 0) result.properties = schemaProps
  if (required.length > 0) result.required = required
  return result
}

function updateBodyParamRefs(params: BodyParameter[], oldRef: string, newRef: string): { params: BodyParameter[]; count: number } {
  let count = 0

  const nextParams = params.map((param) => {
    if (param.type === 'object') {
      const op = param as ObjectBodyParameter
      if (op.ref) {
        if (op.ref === oldRef) {
          count += 1
          return { ...op, ref: newRef }
        }
        return op
      }

      const updated = updateBodyParamRefs(op.properties, oldRef, newRef)
      count += updated.count
      return updated.count > 0 ? { ...op, properties: updated.params } : op
    }

    if (param.type === 'array') {
      const ap = param as ArrayBodyParameter
      if (ap.itemType === 'object' && ap.itemProperties) {
        const updated = updateBodyParamRefs(ap.itemProperties, oldRef, newRef)
        count += updated.count
        return updated.count > 0 ? { ...ap, itemProperties: updated.params } : ap
      }
    }

    return param
  })

  return { params: nextParams, count }
}

export function renameSchemaRefsInRequestBodies(
  spec: OpenAPISpecification,
  oldName: string,
  newName: string,
): { content: Record<string, unknown>; updatedCount: number } {
  const oldRef = buildSchemaRef(oldName)
  const newRef = buildSchemaRef(newName)

  const content = JSON.parse(JSON.stringify(spec.content)) as Record<string, any>
  const paths = (content.paths as Record<string, any>) || {}
  let updatedCount = 0

  for (const pathName of Object.keys(paths)) {
    const pathObj = paths[pathName] || {}

    for (const method of HTTP_METHODS) {
      const op = pathObj[method.toLowerCase()]
      if (!op || typeof op !== 'object') continue

      const body = op._requestBody
      if (!body || !Array.isArray(body.properties)) continue

      const updated = updateBodyParamRefs(body.properties, oldRef, newRef)
      if (updated.count > 0) {
        op._requestBody = { ...body, properties: updated.params }
        updatedCount += updated.count
      }
    }
  }

  return { content, updatedCount }
}

function replaceRefDeep(
  value: unknown,
  oldRef: string,
  newRef: string,
): { value: unknown; count: number } {
  if (Array.isArray(value)) {
    let count = 0
    const next = value.map((item) => {
      const updated = replaceRefDeep(item, oldRef, newRef)
      count += updated.count
      return updated.value
    })
    return { value: next, count }
  }

  if (!value || typeof value !== 'object') {
    return { value, count: 0 }
  }

  let count = 0
  const next: Record<string, unknown> = {}
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (key === '$ref' && raw === oldRef) {
      next[key] = newRef
      count += 1
      continue
    }

    const updated = replaceRefDeep(raw, oldRef, newRef)
    next[key] = updated.value
    count += updated.count
  }

  return { value: next, count }
}

export function renameSchemaRefsInResponses(
  spec: OpenAPISpecification,
  oldName: string,
  newName: string,
): { content: Record<string, unknown>; updatedCount: number } {
  const oldRef = buildSchemaRef(oldName)
  const newRef = buildSchemaRef(newName)

  const content = JSON.parse(JSON.stringify(spec.content)) as Record<string, any>
  const paths = (content.paths as Record<string, any>) || {}
  let updatedCount = 0

  for (const pathName of Object.keys(paths)) {
    const pathObj = paths[pathName] || {}

    for (const method of HTTP_METHODS) {
      const op = pathObj[method.toLowerCase()]
      if (!op || typeof op !== 'object') continue

      const responses = op.responses
      if (!responses || typeof responses !== 'object' || Array.isArray(responses)) continue

      const replaced = replaceRefDeep(responses, oldRef, newRef)
      if (replaced.count > 0) {
        op.responses = replaced.value
        updatedCount += replaced.count
      }
    }
  }

  return { content, updatedCount }
}

function collectSchemaRefNamesFromInternalBody(params: BodyParameter[], refs: Set<string>) {
  for (const param of params) {
    if (param.type === 'object') {
      const objectParam = param as ObjectBodyParameter
      if (typeof objectParam.ref === 'string') {
        const schemaName = getSchemaNameFromRef(objectParam.ref)
        if (schemaName) refs.add(schemaName)
      }

      if (Array.isArray(objectParam.properties) && objectParam.properties.length > 0) {
        collectSchemaRefNamesFromInternalBody(objectParam.properties, refs)
      }
      continue
    }

    if (param.type === 'array') {
      const arrayParam = param as ArrayBodyParameter
      if (arrayParam.itemType === 'object' && Array.isArray(arrayParam.itemProperties) && arrayParam.itemProperties.length > 0) {
        collectSchemaRefNamesFromInternalBody(arrayParam.itemProperties, refs)
      }
    }
  }
}

function collectSchemaRefNamesFromValue(
  value: unknown,
  content: Record<string, unknown>,
  refs: Set<string>,
  visitedRefs: Set<string>,
) {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectSchemaRefNamesFromValue(item, content, refs, visitedRefs)
    }
    return
  }

  if (!value || typeof value !== 'object') {
    return
  }

  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (key === '$ref' && typeof raw === 'string') {
      const schemaName = getSchemaNameFromRef(raw)
      if (schemaName) {
        refs.add(schemaName)
      }

      if (visitedRefs.has(raw)) continue
      visitedRefs.add(raw)

      const responseRefMatch = raw.match(/^#\/components\/responses\/([^/]+)$/)
      if (responseRefMatch) {
        const responseName = responseRefMatch[1]
        const components = (content.components as Record<string, unknown>) || {}
        const responses = (components.responses as Record<string, unknown>) || {}
        collectSchemaRefNamesFromValue(responses[responseName], content, refs, visitedRefs)
      }

      const requestBodyRefMatch = raw.match(/^#\/components\/requestBodies\/([^/]+)$/)
      if (requestBodyRefMatch) {
        const requestBodyName = requestBodyRefMatch[1]
        const components = (content.components as Record<string, unknown>) || {}
        const requestBodies = (components.requestBodies as Record<string, unknown>) || {}
        collectSchemaRefNamesFromValue(requestBodies[requestBodyName], content, refs, visitedRefs)
      }

      continue
    }

    collectSchemaRefNamesFromValue(raw, content, refs, visitedRefs)
  }
}

function buildSchemaDependencyGraph(content: Record<string, unknown>): Record<string, Set<string>> {
  const components = (content.components as Record<string, unknown>) || {}
  const schemas = (components.schemas as Record<string, unknown>) || {}

  const graph: Record<string, Set<string>> = {}

  for (const [schemaName, schemaValue] of Object.entries(schemas)) {
    const refs = new Set<string>()
    collectSchemaRefNamesFromValue(schemaValue, content, refs, new Set())
    graph[schemaName] = refs
  }

  return graph
}

function buildTransitiveDependents(graph: Record<string, Set<string>>, targetSchemaName: string): Set<string> {
  const memo = new Map<string, boolean>()

  const reachesTarget = (schemaName: string, stack: Set<string>): boolean => {
    if (schemaName === targetSchemaName) return true
    if (memo.has(schemaName)) return memo.get(schemaName) === true
    if (stack.has(schemaName)) return false

    stack.add(schemaName)
    const deps = graph[schemaName] || new Set<string>()

    let found = false
    for (const dep of deps) {
      if (dep === targetSchemaName || reachesTarget(dep, stack)) {
        found = true
        break
      }
    }

    stack.delete(schemaName)
    memo.set(schemaName, found)
    return found
  }

  const dependents = new Set<string>()
  for (const schemaName of Object.keys(graph)) {
    if (reachesTarget(schemaName, new Set())) {
      dependents.add(schemaName)
    }
  }

  dependents.add(targetSchemaName)
  return dependents
}

export function collectSchemaUsageOperations(
  spec: OpenAPISpecification,
  schemaName: string,
): SchemaUsageOperation[] {
  if (!schemaName.trim()) return []

  const content = spec.content as Record<string, unknown>
  const paths = (content.paths as Record<string, unknown>) || {}
  const dependencyGraph = buildSchemaDependencyGraph(content)
  const dependentSchemas = buildTransitiveDependents(dependencyGraph, schemaName)

  const usageMap = new Map<string, SchemaUsageOperation>()

  for (const [pathName, pathValue] of Object.entries(paths)) {
    if (!pathValue || typeof pathValue !== 'object' || Array.isArray(pathValue)) continue
    const pathObj = pathValue as Record<string, unknown>

    for (const method of HTTP_METHODS) {
      const opValue = pathObj[method.toLowerCase()]
      if (!opValue || typeof opValue !== 'object' || Array.isArray(opValue)) continue

      const op = opValue as Record<string, unknown>
      const operationRefs = new Set<string>()

      const internalBody = op._requestBody as RequestBody | undefined
      if (internalBody && Array.isArray(internalBody.properties)) {
        collectSchemaRefNamesFromInternalBody(internalBody.properties, operationRefs)
      }

      collectSchemaRefNamesFromValue(op.requestBody, content, operationRefs, new Set())
      collectSchemaRefNamesFromValue(op.responses, content, operationRefs, new Set())

      const hasUsage = Array.from(operationRefs).some((refName) => dependentSchemas.has(refName))
      if (!hasUsage) continue

      const key = `${method} ${pathName}`
      usageMap.set(key, { method, path: pathName })
    }
  }

  return Array.from(usageMap.values()).sort((a, b) => {
    if (a.path === b.path) return a.method.localeCompare(b.method)
    return a.path.localeCompare(b.path)
  })
}

export function renameSchemaRefsEverywhere(
  spec: OpenAPISpecification,
  oldName: string,
  newName: string,
): { content: Record<string, unknown>; updatedCount: number } {
  const oldRef = buildSchemaRef(oldName)
  const newRef = buildSchemaRef(newName)

  const content = JSON.parse(JSON.stringify(spec.content)) as Record<string, unknown>
  const replaced = replaceRefDeep(content, oldRef, newRef)

  return {
    content: replaced.value as Record<string, unknown>,
    updatedCount: replaced.count,
  }
}
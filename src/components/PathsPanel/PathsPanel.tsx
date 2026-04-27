/**
 * PathsPanel Component
 * Manages API paths and operations in the specification
 * Implements WP-002.1, WP-002.2, WP-002.3, WP-002.4, WP-006
 */

import React, { useState } from 'react'
import { OpenAPISpecification, HTTPMethod, PathOperation, PathParameter, QueryParameter, RequestBody, OperationSecurityRequirement, SecurityScheme } from '../../types'
import { PathEditForm } from './PathEditForm'
import { sortStringsCaseInsensitiveStable } from '../../utils/sortUtils'
import { buildObjectSchemaFromProperties, buildSchemaRef, isValidSchemaName } from '../../utils/schemaUtils'
import { AppButton, Badge, EmptyState, PanelShell, SectionHeader, TextInput, PathsIcon, PlusIcon, getMethodBadgeClass } from '../ui'

const HTTP_METHODS: HTTPMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']

interface PathsPanelProps {
  specification: OpenAPISpecification
  onUpdateSpecification?: (updater: (spec: OpenAPISpecification) => OpenAPISpecification) => void
  onUpdateSpecificationAndSave?: (updater: (spec: OpenAPISpecification) => OpenAPISpecification) => void
  viewMode?: 'form' | 'list'
  onViewModeChange?: (mode: 'form' | 'list') => void
  selectedPath?: string | null
  onSelectedPathChange?: (path: string | null) => void
  onOpenSchemaRef?: (schemaName: string) => void
}

type ViewMode = 'form' | 'list'

export function PathsPanel({
  specification,
  onUpdateSpecification,
  onUpdateSpecificationAndSave,
  viewMode: externalViewMode,
  onViewModeChange,
  selectedPath: externalSelectedPath,
  onSelectedPathChange,
  onOpenSchemaRef,
}: PathsPanelProps) {
  // View mode state - WP-002.1
  // Use external view mode if provided (controlled by parent), otherwise manage internally
  const [internalViewMode, setInternalViewMode] = useState<ViewMode>('list')
  const viewMode = externalViewMode ?? internalViewMode

  const setViewMode = (mode: ViewMode) => {
    if (externalViewMode === undefined) {
      setInternalViewMode(mode)
    }
    onViewModeChange?.(mode)
  }

  // Path creation state
  const [newPathName, setNewPathName] = useState('')

  // Path selection state - WP-002.2, WP-002.4
  // Use external selected path if provided (controlled by parent), otherwise manage internally
  const [internalSelectedPath, setInternalSelectedPath] = useState<string | null>(null)
  const selectedPath = externalSelectedPath !== undefined ? externalSelectedPath : internalSelectedPath

  const setSelectedPath = (path: string | null) => {
    if (externalSelectedPath === undefined) {
      setInternalSelectedPath(path)
    }
    onSelectedPathChange?.(path)
  }

  const paths = (specification.content.paths as Record<string, any>) || {}
  const sortedPathNames = sortStringsCaseInsensitiveStable(Object.keys(paths))
  const components = (specification.content.components as Record<string, any>) || {}
  const schemas = (components.schemas as Record<string, unknown>) || {}
  const responseComponents = (components.responses as Record<string, unknown>) || {}
  const pathCount = Object.keys(paths).length

  const getPathOperations = (path: string): Record<string, PathOperation> => {
    const pathObj = paths[path] || {}
    const httpMethods = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options']
    return Object.entries(pathObj)
      .filter(([key]) => httpMethods.includes(key))
      .reduce((acc, [key, value]) => {
        acc[key.toUpperCase()] = value as PathOperation
        return acc
      }, {} as Record<string, PathOperation>)
  }

  // Handlers for WP-002.1
  const handleAddPathClick = () => {
    setViewMode('form')
    setNewPathName('')
  }

  const handleCreatePath = () => {
    if (newPathName.trim() && onUpdateSpecification) {
      onUpdateSpecification((spec) => {
        const updatedPaths = { ...(spec.content.paths as Record<string, any>) || {} }
        updatedPaths[newPathName] = {}
        return {
          ...spec,
          content: {
            ...spec.content,
            paths: updatedPaths,
          },
          updatedAt: Date.now(),
        }
      })
      // After creating path, automatically select it to open the edit form (WP-002.4)
      setSelectedPath(newPathName)
      setNewPathName('')
      // Switch to list mode so PathEditForm is shown
      setViewMode('list')
    }
  }

  const handleCancelCreate = () => {
    setNewPathName('')
    setViewMode('list')
  }

  // Handlers for WP-002.2
  const handleSelectPath = (pathName: string) => {
    setSelectedPath(pathName)
  }

  // Get operations for selected path (WP-002.4)
  const getOperationsForEditForm = (): Record<HTTPMethod, PathOperation | undefined> => {
    if (!selectedPath) {
      // Return empty record with all HTTP methods set to undefined
      const emptyOps: Record<HTTPMethod, PathOperation | undefined> = {} as Record<HTTPMethod, PathOperation | undefined>
      HTTP_METHODS.forEach((method) => {
        emptyOps[method] = undefined
      })
      return emptyOps
    }
    const pathObj = paths[selectedPath] || {}
    const result: Record<HTTPMethod, PathOperation | undefined> = {} as Record<HTTPMethod, PathOperation | undefined>
    HTTP_METHODS.forEach((method) => {
      result[method] = pathObj[method.toLowerCase()]
    })
    return result
  }

  // Handle add operation from PathEditForm (WP-002.4)
  const handleAddOperationFromForm = (method: HTTPMethod) => {
    if (selectedPath && onUpdateSpecification) {
      onUpdateSpecification((spec) => {
        const updatedPaths = { ...(spec.content.paths as Record<string, any>) }
        const pathObj = updatedPaths[selectedPath] || {}

        updatedPaths[selectedPath] = {
          ...pathObj,
          [method.toLowerCase()]: {
            summary: `${method} operation`,
            description: '',
            tags: [],
            responses: {
              '200': {
                description: 'Successful response',
              },
            },
          } as PathOperation,
        }

        return {
          ...spec,
          content: {
            ...spec.content,
            paths: updatedPaths,
          },
          updatedAt: Date.now(),
        }
      })
    }
  }

  // Handle delete operation from PathEditForm (WP-002.4)
  const handleDeleteOperationFromForm = (method: HTTPMethod) => {
    if (selectedPath && onUpdateSpecification) {
      onUpdateSpecification((spec) => {
        const updatedPaths = { ...(spec.content.paths as Record<string, any>) }
        const pathObj = updatedPaths[selectedPath] || {}
        const updatedPathObj = { ...pathObj }
        delete updatedPathObj[method.toLowerCase()]

        updatedPaths[selectedPath] = updatedPathObj

        return {
          ...spec,
          content: {
            ...spec.content,
            paths: updatedPaths,
          },
          updatedAt: Date.now(),
        }
      })
    }
  }

  // Handle path name rename from PathEditForm (WP-005)
  const handleRenamePathName = (newPathName: string): { success: boolean; error?: string } => {
    if (!selectedPath || !onUpdateSpecification) {
      return { success: false, error: 'No path selected' }
    }

    // Trim the new name
    const trimmedNewName = newPathName.trim()

    // Check if new name already exists (and it's not the same as current)
    const allPaths = (specification.content.paths as Record<string, any>) || {}
    if (trimmedNewName !== selectedPath && allPaths[trimmedNewName]) {
      return {
        success: false,
        error: `A path with the name "${trimmedNewName}" already exists. Please choose a different name.`,
      }
    }

    // If the name hasn't changed, nothing to do
    if (trimmedNewName === selectedPath) {
      return { success: true }
    }

    // Perform the rename - WP-005
    onUpdateSpecification((spec) => {
      const updatedPaths = { ...(spec.content.paths as Record<string, any>) || {} }

      // Copy all operations from old path to new path
      const oldPathData = updatedPaths[selectedPath] || {}
      updatedPaths[trimmedNewName] = { ...oldPathData }

      // Delete the old path
      delete updatedPaths[selectedPath]

      return {
        ...spec,
        content: {
          ...spec.content,
          paths: updatedPaths,
        },
        updatedAt: Date.now(),
      }
    })

    // Update selected path to new name so it remains selected
    setSelectedPath(trimmedNewName)

    return { success: true }
  }

  // WP-006: Path parameters handlers
  const getPathParametersForEditForm = (): PathParameter[] => {
    if (!selectedPath) return []
    const paths = (specification.content.paths as Record<string, any>) || {}
    const pathObj = paths[selectedPath] || {}
    return pathObj.parameters || []
  }

  const handlePathParametersChange = (parameters: PathParameter[]) => {
    if (selectedPath && onUpdateSpecification) {
      onUpdateSpecification((spec) => {
        const paths = (spec.content.paths as Record<string, any>) || {}
        const pathObj = paths[selectedPath] || {}

        return {
          ...spec,
          content: {
            ...spec.content,
            paths: {
              ...paths,
              [selectedPath]: {
                ...pathObj,
                parameters,
              },
            },
          },
          updatedAt: Date.now(),
        }
      })
    }
  }

  const handlePathParameterUpdate = (paramName: string, updates: Partial<PathParameter>) => {
    if (selectedPath && onUpdateSpecification) {
      onUpdateSpecification((spec) => {
        const paths = (spec.content.paths as Record<string, any>) || {}
        const pathObj = paths[selectedPath] || {}
        const parameters = pathObj.parameters || []

        const updatedParameters = parameters.map((param: PathParameter) =>
          param.name === paramName ? { ...param, ...updates } : param
        )

        return {
          ...spec,
          content: {
            ...spec.content,
            paths: {
              ...paths,
              [selectedPath]: {
                ...pathObj,
                parameters: updatedParameters,
              },
            },
          },
          updatedAt: Date.now(),
        }
      })
    }
  }

  // WP-011: Query parameter handlers (with immediate save per WP-019)
  const getQueryParametersForOperation = (method: HTTPMethod): QueryParameter[] => {
    if (!selectedPath) return []
    const paths = (specification.content.paths as Record<string, any>) || {}
    const pathObj = paths[selectedPath] || {}
    const operation = pathObj[method.toLowerCase()]
    return operation?._queryParams || []
  }

  const handleQueryParametersChange = (method: HTTPMethod, parameters: QueryParameter[]) => {
    if (selectedPath) {
      const updateFn = onUpdateSpecificationAndSave || onUpdateSpecification
      if (updateFn) {
        updateFn((spec) => {
          const paths = (spec.content.paths as Record<string, any>) || {}
          const pathObj = paths[selectedPath] || {}
          const operation = pathObj[method.toLowerCase()] || {}
          return {
            ...spec,
            content: {
              ...spec.content,
              paths: {
                ...paths,
                [selectedPath]: {
                  ...pathObj,
                  [method.toLowerCase()]: {
                    ...operation,
                    _queryParams: parameters,
                  },
                },
              },
            },
            updatedAt: Date.now(),
          }
        })
      }
    }
  }

  // WP-022: Request body handlers
  const getRequestBodyForOperation = (method: HTTPMethod): RequestBody | undefined => {
    if (!selectedPath) return undefined
    const paths = (specification.content.paths as Record<string, any>) || {}
    const pathObj = paths[selectedPath] || {}
    const operation = pathObj[method.toLowerCase()]
    return operation?._requestBody
  }

  const handleRequestBodyChange = (method: HTTPMethod, body: RequestBody) => {
    if (selectedPath) {
      const updateFn = onUpdateSpecificationAndSave || onUpdateSpecification
      if (updateFn) {
        updateFn((spec) => {
          const paths = (spec.content.paths as Record<string, any>) || {}
          const pathObj = paths[selectedPath] || {}
          const operation = pathObj[method.toLowerCase()] || {}
          return {
            ...spec,
            content: {
              ...spec.content,
              paths: {
                ...paths,
                [selectedPath]: {
                  ...pathObj,
                  [method.toLowerCase()]: {
                    ...operation,
                    _requestBody: body,
                  },
                },
              },
            },
            updatedAt: Date.now(),
          }
        })
      }
    }
  }

  const handleRequestBodyCreateSchemaFromInline = (
    method: HTTPMethod,
    schemaName: string,
  ): { ok: boolean; error?: string } => {
    if (!selectedPath) {
      return { ok: false, error: 'No path is currently selected.' }
    }

    const updateFn = onUpdateSpecificationAndSave || onUpdateSpecification
    if (!updateFn) {
      return { ok: false, error: 'Specification updater is unavailable.' }
    }

    const trimmedSchemaName = schemaName.trim()
    if (!trimmedSchemaName) {
      return { ok: false, error: 'Schema name is required.' }
    }

    if (!isValidSchemaName(trimmedSchemaName)) {
      return {
        ok: false,
        error: 'Schema name is invalid. Use letters, numbers, hyphens, or underscores.',
      }
    }

    if (schemas[trimmedSchemaName]) {
      return {
        ok: false,
        error: `Schema "${trimmedSchemaName}" already exists in components/schemas.`,
      }
    }

    const sourceBody = getRequestBodyForOperation(method)
    if (!sourceBody) {
      return { ok: false, error: 'No request body is defined for this operation.' }
    }

    if (sourceBody.schemaRef) {
      return { ok: false, error: 'This request body already uses a schema reference.' }
    }

    updateFn((spec) => {
      const nextPaths = { ...((spec.content.paths as Record<string, any>) || {}) }
      const pathObj = { ...(nextPaths[selectedPath] || {}) }
      const operation = { ...(pathObj[method.toLowerCase()] || {}) }
      const requestBody = operation._requestBody as RequestBody | undefined

      if (!requestBody) return spec

      const nextBody: RequestBody = {
        ...requestBody,
        schemaRef: buildSchemaRef(trimmedSchemaName),
        properties: [],
      }

      operation._requestBody = nextBody
      pathObj[method.toLowerCase()] = operation
      nextPaths[selectedPath] = pathObj

      const components = { ...((spec.content.components as Record<string, any>) || {}) }
      const nextSchemas = { ...((components.schemas as Record<string, unknown>) || {}) }
      nextSchemas[trimmedSchemaName] = buildObjectSchemaFromProperties(requestBody.properties)
      components.schemas = nextSchemas

      return {
        ...spec,
        content: {
          ...spec.content,
          paths: nextPaths,
          components,
        },
        updatedAt: Date.now(),
      }
    })

    return { ok: true }
  }

  // WP-040-WP-046: Operation responses handlers
  const getResponsesForOperation = (method: HTTPMethod): Record<string, unknown> => {
    if (!selectedPath) return {}
    const paths = (specification.content.paths as Record<string, any>) || {}
    const pathObj = paths[selectedPath] || {}
    const operation = pathObj[method.toLowerCase()]
    const responses = operation?.responses
    if (!responses || typeof responses !== 'object' || Array.isArray(responses)) return {}
    return responses as Record<string, unknown>
  }

  const handleResponsesChange = (method: HTTPMethod, responses: Record<string, unknown>) => {
    if (!selectedPath) return
    const updateFn = onUpdateSpecificationAndSave || onUpdateSpecification
    if (!updateFn) return

    updateFn((spec) => {
      const paths = (spec.content.paths as Record<string, any>) || {}
      const pathObj = paths[selectedPath] || {}
      const operation = pathObj[method.toLowerCase()] || {}
      return {
        ...spec,
        content: {
          ...spec.content,
          paths: {
            ...paths,
            [selectedPath]: {
              ...pathObj,
              [method.toLowerCase()]: {
                ...operation,
                responses,
              },
            },
          },
        },
        updatedAt: Date.now(),
      }
    })
  }

  const handleResponseCreateSchemaFromInline = (
    method: HTTPMethod,
    statusCode: string,
    mediaType: string,
    schemaName: string,
  ): { ok: boolean; error?: string } => {
    if (!selectedPath) {
      return { ok: false, error: 'No path is currently selected.' }
    }

    const updateFn = onUpdateSpecificationAndSave || onUpdateSpecification
    if (!updateFn) {
      return { ok: false, error: 'Specification updater is unavailable.' }
    }

    const trimmedSchemaName = schemaName.trim()
    if (!trimmedSchemaName) {
      return { ok: false, error: 'Schema name is required.' }
    }

    if (!isValidSchemaName(trimmedSchemaName)) {
      return {
        ok: false,
        error: 'Schema name is invalid. Use letters, numbers, hyphens, or underscores.',
      }
    }

    if (schemas[trimmedSchemaName]) {
      return {
        ok: false,
        error: `Schema "${trimmedSchemaName}" already exists in components/schemas.`,
      }
    }

    const responseCollection = getResponsesForOperation(method)
    const rawResponse = responseCollection[statusCode]
    if (!rawResponse || typeof rawResponse !== 'object' || Array.isArray(rawResponse)) {
      return { ok: false, error: `Response ${statusCode} is not editable.` }
    }

    const responseObj = rawResponse as Record<string, unknown>
    const content = responseObj.content
    if (!content || typeof content !== 'object' || Array.isArray(content)) {
      return { ok: false, error: `Response ${statusCode} has no editable content.` }
    }

    const mediaEntry = (content as Record<string, unknown>)[mediaType]
    if (!mediaEntry || typeof mediaEntry !== 'object' || Array.isArray(mediaEntry)) {
      return { ok: false, error: `Response ${statusCode} / ${mediaType} is not editable.` }
    }

    const mediaSchema = (mediaEntry as Record<string, unknown>).schema
    if (!mediaSchema || typeof mediaSchema !== 'object' || Array.isArray(mediaSchema)) {
      return { ok: false, error: 'Inline response schema is missing or invalid.' }
    }

    updateFn((spec) => {
      const nextPaths = { ...((spec.content.paths as Record<string, any>) || {}) }
      const pathObj = { ...(nextPaths[selectedPath] || {}) }
      const operation = { ...(pathObj[method.toLowerCase()] || {}) }
      const currentResponses = operation.responses

      if (!currentResponses || typeof currentResponses !== 'object' || Array.isArray(currentResponses)) {
        return spec
      }

      const nextResponses = { ...(currentResponses as Record<string, unknown>) }
      const nextResponseEntryRaw = nextResponses[statusCode]
      if (!nextResponseEntryRaw || typeof nextResponseEntryRaw !== 'object' || Array.isArray(nextResponseEntryRaw)) {
        return spec
      }

      const nextResponseEntry = { ...(nextResponseEntryRaw as Record<string, unknown>) }
      const nextContentRaw = nextResponseEntry.content
      if (!nextContentRaw || typeof nextContentRaw !== 'object' || Array.isArray(nextContentRaw)) {
        return spec
      }

      const nextContent = { ...(nextContentRaw as Record<string, unknown>) }
      const nextMediaRaw = nextContent[mediaType]
      if (!nextMediaRaw || typeof nextMediaRaw !== 'object' || Array.isArray(nextMediaRaw)) {
        return spec
      }

      const nextMedia = { ...(nextMediaRaw as Record<string, unknown>) }
      nextMedia.schema = { $ref: buildSchemaRef(trimmedSchemaName) }
      nextContent[mediaType] = nextMedia
      nextResponseEntry.content = nextContent
      nextResponses[statusCode] = nextResponseEntry
      operation.responses = nextResponses
      pathObj[method.toLowerCase()] = operation
      nextPaths[selectedPath] = pathObj

      const components = { ...((spec.content.components as Record<string, any>) || {}) }
      const nextSchemas = { ...((components.schemas as Record<string, unknown>) || {}) }
      nextSchemas[trimmedSchemaName] = mediaSchema
      components.schemas = nextSchemas

      return {
        ...spec,
        content: {
          ...spec.content,
          paths: nextPaths,
          components,
        },
        updatedAt: Date.now(),
      }
    })

    return { ok: true }
  }

  // WP-027–WP-031: Security handlers (with immediate save)
  const getOperationSecurity = (method: HTTPMethod): OperationSecurityRequirement[] => {
    if (!selectedPath) return []
    const paths = (specification.content.paths as Record<string, any>) || {}
    const pathObj = paths[selectedPath] || {}
    const operation = pathObj[method.toLowerCase()]
    return operation?._security || []
  }

  const getSecuritySchemes = (): Record<string, SecurityScheme> => {
    const components = (specification.content.components as Record<string, any>) || {}
    return (components.securitySchemes as Record<string, SecurityScheme>) || {}
  }

  /** Returns the set of scheme names used by ALL operations EXCEPT the given method on the selected path. */
  const getOtherOperationsSchemeNames = (currentMethod: HTTPMethod): Set<string> => {
    const names = new Set<string>()
    const paths = (specification.content.paths as Record<string, any>) || {}
    for (const [pName, pathObj] of Object.entries(paths)) {
      for (const m of HTTP_METHODS) {
        // Skip the current operation
        if (pName === selectedPath && m === currentMethod) continue
        const op = (pathObj as any)[m.toLowerCase()]
        if (!op) continue
        const sec: OperationSecurityRequirement[] = op._security || []
        for (const req of sec) names.add(req.schemeName)
      }
    }
    return names
  }

  const handleOperationSecurityChange = (
    method: HTTPMethod,
    security: OperationSecurityRequirement[],
    schemes: Record<string, SecurityScheme>,
  ) => {
    if (!selectedPath) return
    const updateFn = onUpdateSpecificationAndSave || onUpdateSpecification
    if (!updateFn) return
    updateFn((spec) => {
      const paths = (spec.content.paths as Record<string, any>) || {}
      const pathObj = paths[selectedPath] || {}
      const operation = pathObj[method.toLowerCase()] || {}
      const components = (spec.content.components as Record<string, any>) || {}
      return {
        ...spec,
        content: {
          ...spec.content,
          paths: {
            ...paths,
            [selectedPath]: {
              ...pathObj,
              [method.toLowerCase()]: {
                ...operation,
                _security: security,
              },
            },
          },
          components: {
            ...components,
            securitySchemes: schemes,
          },
        },
        updatedAt: Date.now(),
      }
    })
  }

  return (
    <PanelShell
      title={selectedPath ? 'Edit Path' : 'API Paths'}
      description={selectedPath ? 'Manage operations, parameters, request bodies, responses, and security for the selected route.' : 'Define endpoints and operations available in your API.'}
      actions={selectedPath ? <Badge variant="status" tone="info">Editing {selectedPath}</Badge> : <AppButton variant="primary" onClick={handleAddPathClick} leadingIcon={<PlusIcon className="h-4 w-4" />}>Add Path</AppButton>}
      className="flex-1"
    >
      {selectedPath !== null ? (
        <PathEditForm
          pathName={selectedPath}
          operations={getOperationsForEditForm()}
          onAddOperation={handleAddOperationFromForm}
          onDeleteOperation={handleDeleteOperationFromForm}
          onRenamePathName={handleRenamePathName}
          onClose={() => setSelectedPath(null)}
          pathParameters={getPathParametersForEditForm()}
          onPathParametersChange={handlePathParametersChange}
          onPathParameterUpdate={handlePathParameterUpdate}
          getQueryParameters={getQueryParametersForOperation}
          onQueryParametersChange={handleQueryParametersChange}
          getRequestBody={getRequestBodyForOperation}
          onRequestBodyChange={handleRequestBodyChange}
          onRequestBodyCreateSchemaFromInline={handleRequestBodyCreateSchemaFromInline}
          schemas={schemas}
          responseComponents={responseComponents}
          getResponses={getResponsesForOperation}
          onResponsesChange={handleResponsesChange}
          onResponseCreateSchemaFromInline={handleResponseCreateSchemaFromInline}
          getOperationSecurity={getOperationSecurity}
          getSecuritySchemes={getSecuritySchemes}
          getOtherOperationsSchemeNames={getOtherOperationsSchemeNames}
          onOperationSecurityChange={handleOperationSecurityChange}
          onOpenSchemaRef={onOpenSchemaRef}
        />
      ) : (
        <>
          {viewMode === 'form' ? (
            <div className="ui-panel max-w-2xl p-6">
              <SectionHeader
                title="Create New Path"
                description="Start with the route name. Operations can be added immediately after creation."
              />
              <div className="mt-6 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-text-primary">Path Name</label>
                  <TextInput
                    type="text"
                    value={newPathName}
                    onChange={(e) => setNewPathName(e.target.value)}
                    placeholder="/users"
                    className="font-mono"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreatePath()
                    }}
                    autoFocus
                  />
                  <p className="mt-2 text-xs text-text-muted">Examples: /users, /products/{'{id}'}, /api/v1/items</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <AppButton variant="primary" onClick={handleCreatePath} disabled={!newPathName.trim()}>Create Path</AppButton>
                  <AppButton variant="ghost" onClick={handleCancelCreate}>Cancel</AppButton>
                </div>
              </div>
            </div>
          ) : null}

          {viewMode === 'list' && pathCount === 0 ? (
            <EmptyState
              icon={<PathsIcon className="h-12 w-12" />}
              title="No paths defined yet"
              description="Add your first endpoint to start building operations, query parameters, request bodies, responses, and security rules."
              action={<AppButton variant="primary" onClick={handleAddPathClick} leadingIcon={<PlusIcon className="h-4 w-4" />}>Add Path</AppButton>}
            />
          ) : null}

          {viewMode === 'list' && pathCount > 0 ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {sortedPathNames.map((pathName) => {
                const pathOps = getPathOperations(pathName)
                const methodNames = Object.keys(pathOps) as HTTPMethod[]

                return (
                  <button
                    key={pathName}
                    onClick={() => handleSelectPath(pathName)}
                    className="ui-card-interactive p-5 text-left"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="font-mono text-lg font-semibold text-text-primary">{pathName}</div>
                        <p className="mt-2 text-sm text-text-secondary">
                          {methodNames.length > 0 ? `${methodNames.length} operation${methodNames.length === 1 ? '' : 's'} configured` : 'No operations defined yet'}
                        </p>
                      </div>
                      <Badge variant="count">{methodNames.length}</Badge>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {methodNames.length > 0 ? methodNames.map((method) => (
                        <span key={method} className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold tracking-[0.08em] ${getMethodBadgeClass(method)}`}>
                          {method}
                        </span>
                      )) : <Badge variant="status" tone="neutral">No operations</Badge>}
                    </div>
                  </button>
                )
              })}
            </div>
          ) : null}

          {!selectedPath ? (
            <div className="ui-panel-subtle p-5">
              <h3 className="text-lg font-semibold text-text-primary">About Paths</h3>
              <p className="mt-2 text-sm leading-6 text-text-secondary">
                Paths represent the resources and endpoints available in your API. Each path can support multiple HTTP methods, each with its own parameters, request bodies, responses, and security rules.
              </p>
            </div>
          ) : null}
        </>
      )}
    </PanelShell>
  )
}

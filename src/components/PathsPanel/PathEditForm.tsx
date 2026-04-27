/**
 * PathEditForm Component
 * Implements WP-002.4: Edit path with operation management form
 * Shows all available HTTP methods as buttons and allows adding/removing operations
 * Implements WP-005: Allow inline editing of path names
 * Implements WP-006: Path parameters management
 */

import React, { useState, useRef, useEffect } from 'react'
import { HTTPMethod, PathOperation, PathParameter, ParameterType, QueryParameter, RequestBody, BODY_ELIGIBLE_METHODS, OperationSecurityRequirement, SecurityScheme } from '../../types'
import {
  syncParametersWithPath,
  findDuplicateParameterNames,
  findOrphanedParameters,
  validatePathFormat,
} from '../../utils/pathParameterUtils'
import { QueryParametersPanel } from '../QueryParameters/QueryParametersPanel'
import { RequestBodyPanel } from '../RequestBody/RequestBodyPanel'
import { SecurityPanel } from '../Security/SecurityPanel'
import { ResponsesPanel } from '../Responses/ResponsesPanel'
import { AppButton, AppIconButton, Badge, CheckIcon, CloseIcon, ConfirmDialog, EditIcon, getMethodBadgeClass, TrashIcon } from '../ui'

const HTTP_METHODS: HTTPMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']
const PARAMETER_TYPES: ParameterType[] = ['string', 'number', 'integer', 'boolean']

interface PathEditFormProps {
  pathName: string
  operations: Record<HTTPMethod, PathOperation | undefined>
  onAddOperation: (method: HTTPMethod) => void
  onDeleteOperation: (method: HTTPMethod) => void
  onRenamePathName?: (newPathName: string) => { success: boolean; error?: string }
  onClose: () => void
  // WP-006: Path parameters support
  pathParameters?: PathParameter[]
  onPathParametersChange?: (parameters: PathParameter[]) => void
  onPathParameterUpdate?: (paramName: string, updates: Partial<PathParameter>) => void
  // WP-011: Query parameters support
  getQueryParameters?: (method: HTTPMethod) => QueryParameter[]
  onQueryParametersChange?: (method: HTTPMethod, parameters: QueryParameter[]) => void
  // WP-022: Request body support
  getRequestBody?: (method: HTTPMethod) => RequestBody | undefined
  onRequestBodyChange?: (method: HTTPMethod, body: RequestBody) => void
  onRequestBodyCreateSchemaFromInline?: (method: HTTPMethod, schemaName: string) => { ok: boolean; error?: string }
  schemas?: Record<string, unknown>
  responseComponents?: Record<string, unknown>
  // WP-040-WP-046: Responses support
  getResponses?: (method: HTTPMethod) => Record<string, unknown>
  onResponsesChange?: (method: HTTPMethod, responses: Record<string, unknown>) => void
  onResponseCreateSchemaFromInline?: (
    method: HTTPMethod,
    statusCode: string,
    mediaType: string,
    schemaName: string,
  ) => { ok: boolean; error?: string }
  // WP-027: Security support
  getOperationSecurity?: (method: HTTPMethod) => OperationSecurityRequirement[]
  getSecuritySchemes?: () => Record<string, SecurityScheme>
  getOtherOperationsSchemeNames?: (method: HTTPMethod) => Set<string>
  onOperationSecurityChange?: (
    method: HTTPMethod,
    security: OperationSecurityRequirement[],
    schemes: Record<string, SecurityScheme>,
  ) => void
  onOpenSchemaRef?: (schemaName: string) => void
}

export function PathEditForm({
  pathName,
  operations,
  onAddOperation,
  onDeleteOperation,
  onRenamePathName,
  onClose,
  pathParameters = [],
  onPathParametersChange,
  onPathParameterUpdate,
  getQueryParameters,
  onQueryParametersChange,
  getRequestBody,
  onRequestBodyChange,
  onRequestBodyCreateSchemaFromInline,
  schemas = {},
  responseComponents = {},
  getResponses,
  onResponsesChange,
  onResponseCreateSchemaFromInline,
  getOperationSecurity,
  getSecuritySchemes,
  getOtherOperationsSchemeNames,
  onOperationSecurityChange,
  onOpenSchemaRef,
}: PathEditFormProps) {
  const [selectedOperation, setSelectedOperation] = useState<HTTPMethod | null>(null)
  const [showAddConfirmModal, setShowAddConfirmModal] = useState(false)
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false)
  const [methodToAdd, setMethodToAdd] = useState<HTTPMethod | null>(null)
  const [editingDescription, setEditingDescription] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  
  // WP-005: Inline path name editing
  const [isEditingPathName, setIsEditingPathName] = useState(false)
  const [editedPathName, setEditedPathName] = useState(pathName)
  const [pathNameError, setPathNameError] = useState<string | null>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  // WP-006: Validate and sync path parameters
  useEffect(() => {
    if (!onPathParametersChange || !onPathParameterUpdate) return

    const errors: string[] = []
    const formatValidation = validatePathFormat(pathName)
    if (!formatValidation.valid && formatValidation.error) {
      errors.push(formatValidation.error)
    }
    const duplicates = findDuplicateParameterNames(pathParameters)
    if (duplicates.length > 0) {
      errors.push(`Duplicate parameter names: ${duplicates.join(', ')}`)
    }
    const orphaned = findOrphanedParameters(pathName, pathParameters)
    if (orphaned.length > 0) {
      errors.push(
        `Parameters not found in path: ${orphaned.join(', ')}. These parameters do not match any placeholders in the path.`
      )
    }
    setValidationErrors(errors)

    const synced = syncParametersWithPath(pathName, pathParameters)
    if (JSON.stringify(synced) !== JSON.stringify(pathParameters)) {
      onPathParametersChange(synced)
    }
  }, [pathName, pathParameters, onPathParametersChange, onPathParameterUpdate])

  const getMethodColor = (method: HTTPMethod, isAdded: boolean): string => {
    if (isAdded) {
      return `${getMethodBadgeClass(method)} border`
    } else {
      return 'border border-border-default bg-surface-subtle text-text-secondary hover:bg-surface-raised cursor-pointer'
    }
  }

  const getMethodTextColor = (method: HTTPMethod): string => {
    const colors: Record<HTTPMethod, string> = {
      GET: 'text-blue-600',
      POST: 'text-green-600',
      PUT: 'text-yellow-600',
      DELETE: 'text-red-600',
      PATCH: 'text-purple-600',
      HEAD: 'text-gray-600',
      OPTIONS: 'text-indigo-600',
    }
    return colors[method]
  }

  const handleMethodButtonClick = (method: HTTPMethod) => {
    const isAdded = operations[method] !== undefined
    if (!isAdded) {
      setMethodToAdd(method)
      setShowAddConfirmModal(true)
    }
  }

  const handleAddConfirm = () => {
    if (methodToAdd) {
      onAddOperation(methodToAdd)
      // Auto-select the newly created operation
      setSelectedOperation(methodToAdd)
      setShowAddConfirmModal(false)
      setMethodToAdd(null)
    }
  }

  const handleDeleteConfirm = () => {
    if (selectedOperation) {
      onDeleteOperation(selectedOperation)
      setShowDeleteConfirmModal(false)
      setSelectedOperation(null)
    }
  }

  // WP-005: Path name editing handlers
  const handleStartEditingPathName = () => {
    setIsEditingPathName(true)
    setEditedPathName(pathName)
    setPathNameError(null)
    // Focus input after state update
    setTimeout(() => {
      editInputRef.current?.focus()
      editInputRef.current?.select()
    }, 0)
  }

  const validatePathName = (name: string): string | null => {
    // Trim whitespace
    const trimmed = name.trim()
    
    // Check if empty
    if (!trimmed) {
      return 'Path name cannot be empty'
    }
    
    // Check for invalid characters (allow alphanumeric, /, -, _, {}, .)
    if (!/^[a-zA-Z0-9\-_./{}\s]+$/.test(trimmed)) {
      return 'Path name contains invalid characters. Only alphanumeric, /, -, _, {}, and . are allowed'
    }
    
    return null
  }

  const handleSavePathName = () => {
    // Validate
    const error = validatePathName(editedPathName)
    if (error) {
      setPathNameError(error)
      return
    }

    const trimmedName = editedPathName.trim()

    // If no change, just cancel
    if (trimmedName === pathName) {
      setIsEditingPathName(false)
      setPathNameError(null)
      return
    }

    // Call handler to rename path
    if (onRenamePathName) {
      const result = onRenamePathName(trimmedName)
      if (result.success) {
        setIsEditingPathName(false)
        setPathNameError(null)
        setEditedPathName(trimmedName)
      } else {
        setPathNameError(result.error || 'Failed to rename path')
      }
    }
  }

  const handleCancelEditingPathName = () => {
    setIsEditingPathName(false)
    setPathNameError(null)
    setEditedPathName(pathName)
  }

  const handleKeyDownInPathNameInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSavePathName()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancelEditingPathName()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-3xl font-bold text-text-primary">Path Workflow</h2>
            <Badge variant="status" tone="info">Editing route</Badge>
          </div>
          <p className="mt-2 text-sm text-text-secondary">Browse or add operations, then manage their parameters, request bodies, responses, and security.</p>
        </div>
        <AppIconButton label="Close path editor" onClick={onClose}>
          <CloseIcon className="h-4 w-4" />
        </AppIconButton>
      </div>

      <div className="ui-panel p-5">
        <p className="mb-1 text-sm font-medium text-text-secondary">Path</p>
        
        {!isEditingPathName ? (
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-2xl font-mono font-bold text-text-primary">{pathName}</p>
              <Badge variant="count">{pathParameters.length} path params</Badge>
            </div>
            <AppIconButton
              onClick={handleStartEditingPathName}
              label="Edit path name"
            >
              <EditIcon className="h-4 w-4" />
            </AppIconButton>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2 items-start">
              <div className="flex-1">
                <input
                  ref={editInputRef}
                  type="text"
                  value={editedPathName}
                  onChange={(e) => {
                    setEditedPathName(e.target.value)
                    if (pathNameError) setPathNameError(null)
                  }}
                  onKeyDown={handleKeyDownInPathNameInput}
                  placeholder="/api/resource"
                  className="ui-input border-focus-ring font-mono text-lg font-bold"
                />
              </div>
              <AppIconButton label="Save path name" onClick={handleSavePathName}><CheckIcon className="h-4 w-4" /></AppIconButton>
              <AppIconButton label="Cancel editing path name" tone="danger" onClick={handleCancelEditingPathName}><CloseIcon className="h-4 w-4" /></AppIconButton>
            </div>
            
            {pathNameError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-sm font-medium text-red-700">{pathNameError}</p>
              </div>
            )}
            
            <p className="text-xs text-text-muted">Press Enter to save or Escape to cancel.</p>
          </div>
        )}
      </div>

      {/* WP-006: Path Parameters Section */}
      {onPathParametersChange && onPathParameterUpdate && pathParameters.length > 0 && (
        <div className="ui-panel-subtle overflow-hidden">
          <div className="border-b border-border-default bg-surface-raised px-6 py-4">
            <h3 className="text-lg font-bold text-text-primary">Path Parameters</h3>
          </div>

          {validationErrors.length > 0 && (
            <div className="border-b border-red-200 bg-red-50 px-6 py-3">
              {validationErrors.map((error, idx) => (
                <div key={idx} className="mb-2 flex gap-2 text-sm text-red-700 last:mb-0">
                  <span>{error}</span>
                </div>
              ))}
            </div>
          )}

          {/* Parameters Table - One row per parameter */}
          <div className="px-6 py-4">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-3 mb-3 pb-3 border-b border-slate-200">
              <div className="col-span-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Name</div>
              <div className="col-span-2 text-xs font-semibold text-slate-600 uppercase tracking-wide">Type</div>
              <div className="col-span-7 text-xs font-semibold text-slate-600 uppercase tracking-wide">Description</div>
            </div>

            {/* Parameters Rows */}
            <div className="space-y-2">
              {pathParameters.map((param) => (
                <div key={param.name} className="grid grid-cols-12 gap-3 items-start">
                  {/* Name - as label */}
                  <div className="col-span-3 flex items-center pt-2">
                    <code className="text-sm font-mono font-bold text-slate-900">
                      {param.name}
                    </code>
                  </div>

                  {/* Type Selector */}
                  <div className="col-span-2">
                    <select
                      value={param.type}
                      onChange={(e) => onPathParameterUpdate(param.name, { type: e.target.value as ParameterType })}
                      className="ui-select px-2 py-2 text-sm"
                    >
                      {PARAMETER_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Description Field */}
                  <div className="col-span-7">
                    {editingDescription === param.name ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={param.description || ''}
                          onChange={(e) => onPathParameterUpdate(param.name, { description: e.target.value })}
                          onBlur={() => setEditingDescription(null)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === 'Escape') {
                              setEditingDescription(null)
                            }
                          }}
                          placeholder="Enter description..."
                          className="ui-input flex-1 border-focus-ring px-2 py-2 text-sm"
                          autoFocus
                        />
                        <button
                          onClick={() => setEditingDescription(null)}
                          className="rounded px-2 py-2 text-sm font-bold text-emerald-700 transition-colors hover:bg-emerald-50 hover:text-emerald-800"
                          title="Done"
                        >
                          <CheckIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => setEditingDescription(param.name)}
                        className="w-full cursor-pointer rounded border border-border-default bg-surface-base px-2 py-2 text-sm text-text-secondary transition-colors hover:border-focus-ring hover:bg-surface-subtle"
                      >
                        {param.description ? (
                          <span>{param.description}</span>
                        ) : (
                          <span className="text-slate-400 italic">Click to add...</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-border-default bg-surface-raised px-6 py-3 text-xs text-text-secondary">
            <p>Path parameters are always required in OpenAPI specifications.</p>
          </div>
        </div>
      )}

      <div className="ui-panel p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Operations</h3>
            <p className="mt-1 text-sm text-text-secondary">Select an added method to inspect it, or add a new method to extend the path.</p>
          </div>
          {selectedOperation ? <Badge variant="method" tone={selectedOperation}>{selectedOperation}</Badge> : <Badge variant="status" tone="neutral">Browse methods</Badge>}
        </div>

        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-7">
          {HTTP_METHODS.map((method) => {
            const isAdded = operations[method] !== undefined
            const isSelected = selectedOperation === method
            return (
              <button
                key={method}
                onClick={() => {
                  if (isAdded) {
                    setSelectedOperation(isSelected ? null : method)
                  } else {
                    handleMethodButtonClick(method)
                  }
                }}
                className={`rounded-lg px-3 py-3 text-center text-sm font-bold transition-all ${getMethodColor(method, isAdded)} ${isSelected && isAdded ? 'ring-2 ring-focus-ring ring-offset-2 ring-offset-app-bg shadow-panel' : ''}`}
              >
                <div>{method}</div>
                {isAdded ? (
                  <div className="mt-1 text-xs font-normal opacity-75">Active</div>
                ) : (
                  <div className="mt-1 text-xs font-normal">Add</div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {selectedOperation && operations[selectedOperation] && (
        <div className="ui-panel-subtle border-2 border-border-strong p-6">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <Badge variant="method" tone={selectedOperation} className="text-sm">{selectedOperation}</Badge>
                <span className="font-mono text-sm text-text-muted">{pathName}</span>
              </div>
              <div className="text-5xl font-bold">
                <span className={getMethodTextColor(selectedOperation)}>{selectedOperation}</span>
              </div>
            </div>
            <AppButton variant="danger" onClick={() => setShowDeleteConfirmModal(true)} leadingIcon={<TrashIcon className="h-4 w-4" />}>
              Delete Operation
            </AppButton>
          </div>

          <div className="space-y-3 mb-6">
            {operations[selectedOperation]?.summary && (
              <div>
                <p className="text-sm font-medium text-text-secondary">Summary</p>
                <p className="text-text-primary">{operations[selectedOperation]?.summary}</p>
              </div>
            )}

            {operations[selectedOperation]?.description && (
              <div>
                <p className="text-sm font-medium text-text-secondary">Description</p>
                <p className="text-text-primary">{operations[selectedOperation]?.description}</p>
              </div>
            )}
          </div>

          {getQueryParameters && onQueryParametersChange && (
            <QueryParametersPanel
              pathName={pathName}
              method={selectedOperation}
              parameters={getQueryParameters(selectedOperation)}
              onChange={(params) => onQueryParametersChange(selectedOperation, params)}
            />
          )}

          {/* WP-022: Request Body section — only for PUT, POST, PATCH */}
          {getRequestBody && onRequestBodyChange && BODY_ELIGIBLE_METHODS.includes(selectedOperation) && (
            <RequestBodyPanel
              pathName={pathName}
              method={selectedOperation}
              body={getRequestBody(selectedOperation) ?? { required: false, mediaType: 'application/json', properties: [] }}
              onChange={(body) => onRequestBodyChange(selectedOperation, body)}
              schemas={schemas}
              onCreateSchemaFromInline={(schemaName) => {
                if (!onRequestBodyCreateSchemaFromInline) {
                  return { ok: false, error: 'Schema extraction is unavailable for this operation.' }
                }
                return onRequestBodyCreateSchemaFromInline(selectedOperation, schemaName)
              }}
            />
          )}

          {/* WP-040-WP-046: Responses section */}
          {getResponses && onResponsesChange && (
            <ResponsesPanel
              pathName={pathName}
              method={selectedOperation}
              responses={getResponses(selectedOperation)}
              schemas={schemas}
              responseComponents={responseComponents}
              onChange={(responses) => onResponsesChange(selectedOperation, responses)}
              onOpenSchemaRef={onOpenSchemaRef}
              onCreateSchemaFromInline={(statusCode, mediaType, schemaName) => {
                if (!onResponseCreateSchemaFromInline) {
                  return { ok: false, error: 'Schema extraction is unavailable for this response.' }
                }
                return onResponseCreateSchemaFromInline(selectedOperation, statusCode, mediaType, schemaName)
              }}
            />
          )}

          {/* WP-027: Security section */}
          {getOperationSecurity && getSecuritySchemes && getOtherOperationsSchemeNames && onOperationSecurityChange && (
            <SecurityPanel
              pathName={pathName}
              method={selectedOperation}
              security={getOperationSecurity(selectedOperation)}
              securitySchemes={getSecuritySchemes()}
              otherOperationsSchemeNames={getOtherOperationsSchemeNames(selectedOperation)}
              onChange={(security, schemes) =>
                onOperationSecurityChange(selectedOperation, security, schemes)
              }
            />
          )}
        </div>
      )}

      <div className="ui-panel-subtle p-4">
        <p className="text-sm text-text-secondary">
          Click any available HTTP method button to add it to this path. Click an already-added method to view and
          manage its details.
        </p>
      </div>

      <ConfirmDialog
        open={showAddConfirmModal && !!methodToAdd}
        title={`Add ${methodToAdd ?? 'operation'} operation`}
        description={`Create a new ${methodToAdd ?? ''} operation on this path? A default response scaffold will be added.`}
        confirmLabel="Add operation"
        onConfirm={handleAddConfirm}
        onCancel={() => {
          setShowAddConfirmModal(false)
          setMethodToAdd(null)
        }}
        tone="default"
      />

      <ConfirmDialog
        open={showDeleteConfirmModal && !!selectedOperation}
        title="Delete operation"
        description={`Delete the ${selectedOperation ?? ''} operation from this path? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteConfirmModal(false)}
      />
    </div>
  )
}

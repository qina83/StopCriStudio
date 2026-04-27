/**
 * SecurityPanel
 * Manages security requirements per operation.
 * Implements WP-027, WP-028, WP-029, WP-030, WP-031
 */

import React, { useState } from 'react'
import {
  HTTPMethod,
  OperationSecurityRequirement,
  SecurityScheme,
  SecuritySchemeApiKey,
  SecuritySchemeHttp,
  ApiKeyLocation,
  HttpSchemeKind,
} from '../../types'

// ─── Constants ────────────────────────────────────────────────────────────────

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-blue-100 text-blue-800',
  POST: 'bg-green-100 text-green-800',
  PUT: 'bg-yellow-100 text-yellow-800',
  DELETE: 'bg-red-100 text-red-800',
  PATCH: 'bg-purple-100 text-purple-800',
  HEAD: 'bg-gray-100 text-gray-800',
  OPTIONS: 'bg-indigo-100 text-indigo-800',
}

const API_KEY_IN_OPTIONS: ApiKeyLocation[] = ['header', 'query', 'cookie']
const HTTP_SCHEME_OPTIONS: HttpSchemeKind[] = ['basic', 'bearer']

// ─── Form types ───────────────────────────────────────────────────────────────

type SecurityType = 'apiKey' | 'http'

interface SecurityFormState {
  type: SecurityType
  name: string
  // apiKey
  apiKeyIn: ApiKeyLocation
  apiKeyName: string
  // http
  httpScheme: HttpSchemeKind
  bearerFormat: string
}

interface SecurityFormErrors {
  name?: string
  apiKeyName?: string
}

function blankForm(): SecurityFormState {
  return {
    type: 'apiKey',
    name: '',
    apiKeyIn: 'header',
    apiKeyName: '',
    httpScheme: 'bearer',
    bearerFormat: '',
  }
}

function schemeToForm(schemeName: string, scheme: SecurityScheme): SecurityFormState {
  if (scheme.type === 'apiKey') {
    const s = scheme as SecuritySchemeApiKey
    return {
      type: 'apiKey',
      name: schemeName,
      apiKeyIn: s.in,
      apiKeyName: s.name,
      httpScheme: 'bearer',
      bearerFormat: '',
    }
  }
  if (scheme.type === 'http') {
    const s = scheme as SecuritySchemeHttp
    return {
      type: 'http',
      name: schemeName,
      apiKeyIn: 'header',
      apiKeyName: '',
      httpScheme: s.scheme as HttpSchemeKind,
      bearerFormat: s.bearerFormat ?? '',
    }
  }
  return blankForm()
}

function formToScheme(form: SecurityFormState): SecurityScheme {
  if (form.type === 'apiKey') {
    return {
      type: 'apiKey',
      in: form.apiKeyIn,
      name: form.apiKeyName.trim(),
    } as SecuritySchemeApiKey
  }
  const http: SecuritySchemeHttp = {
    type: 'http',
    scheme: form.httpScheme,
  }
  if (form.httpScheme === 'bearer' && form.bearerFormat.trim()) {
    http.bearerFormat = form.bearerFormat.trim()
  }
  return http
}

function validateForm(
  form: SecurityFormState,
  _currentSchemeName?: string,
): SecurityFormErrors {
  const errors: SecurityFormErrors = {}
  if (!form.name.trim()) {
    errors.name = 'Name is required'
  } else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(form.name.trim())) {
    errors.name = 'Name must start with a letter or underscore and contain only letters, digits, and underscores'
  }
  if (form.type === 'apiKey' && !form.apiKeyName.trim()) {
    errors.apiKeyName = 'Key name is required'
  }
  return errors
}

// ─── Scheme type badge ────────────────────────────────────────────────────────

function SchemeBadge({ type }: { type: string }) {
  const color =
    type === 'apiKey'
      ? 'bg-amber-100 text-amber-700'
      : type === 'http'
        ? 'bg-sky-100 text-sky-700'
        : 'bg-slate-100 text-slate-600'
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-semibold font-mono ${color}`}>
      {type}
    </span>
  )
}

// ─── Add / Edit modal ─────────────────────────────────────────────────────────

interface SecurityFormModalProps {
  title: string
  form: SecurityFormState
  errors: SecurityFormErrors
  showExistingWarning: boolean
  onFormChange: (form: SecurityFormState) => void
  onSave: () => void
  onCancel: () => void
}

function SecurityFormModal({
  title,
  form,
  errors,
  showExistingWarning,
  onFormChange,
  onSave,
  onCancel,
}: SecurityFormModalProps) {
  const set = (partial: Partial<SecurityFormState>) => onFormChange({ ...form, ...partial })

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onCancel()
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onCancel}
      onKeyDown={handleKeyDown}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-blue-600 text-white px-6 py-4 rounded-t-xl">
          <h3 className="text-xl font-bold">{title}</h3>
        </div>

        <div className="p-6 space-y-4">
          {/* Type */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Type</label>
            <select
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.type}
              onChange={(e) =>
                set({
                  type: e.target.value as SecurityType,
                  apiKeyName: '',
                  bearerFormat: '',
                })
              }
            >
              <option value="apiKey">apiKey</option>
              <option value="http">http</option>
            </select>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              className={`w-full px-3 py-2 border rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-400 bg-red-50' : 'border-slate-300'}`}
              value={form.name}
              onChange={(e) => set({ name: e.target.value })}
              placeholder={form.type === 'apiKey' ? 'ApiKeyAuth' : 'BearerAuth'}
              autoFocus
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600 font-medium">⚠ {errors.name}</p>
            )}
            {showExistingWarning && !errors.name && (
              <p className="mt-1 text-xs text-amber-600 font-medium">
                ⚠ A scheme with this name already exists in another operation. Saving will reuse that definition.
              </p>
            )}
          </div>

          {/* apiKey fields */}
          {form.type === 'apiKey' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  In <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.apiKeyIn}
                  onChange={(e) => set({ apiKeyIn: e.target.value as ApiKeyLocation })}
                >
                  {API_KEY_IN_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Key name <span className="text-red-500">*</span>
                </label>
                <input
                  className={`w-full px-3 py-2 border rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.apiKeyName ? 'border-red-400 bg-red-50' : 'border-slate-300'}`}
                  value={form.apiKeyName}
                  onChange={(e) => set({ apiKeyName: e.target.value })}
                  placeholder="X-API-Key"
                />
                {errors.apiKeyName && (
                  <p className="mt-1 text-xs text-red-600 font-medium">⚠ {errors.apiKeyName}</p>
                )}
              </div>
            </>
          )}

          {/* http fields */}
          {form.type === 'http' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Scheme <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.httpScheme}
                  onChange={(e) => set({ httpScheme: e.target.value as HttpSchemeKind, bearerFormat: '' })}
                >
                  {HTTP_SCHEME_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {form.httpScheme === 'bearer' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Bearer format{' '}
                    <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <input
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.bearerFormat}
                    onChange={(e) => set({ bearerFormat: e.target.value })}
                    placeholder="JWT"
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex gap-3 justify-end rounded-b-xl">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors font-medium"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface SecurityPanelProps {
  pathName: string
  method: HTTPMethod
  security: OperationSecurityRequirement[]
  securitySchemes: Record<string, SecurityScheme>
  /** Scheme names referenced by OTHER operations (not this one). Used for orphan cleanup and warnings. */
  otherOperationsSchemeNames: Set<string>
  onChange: (
    updatedSecurity: OperationSecurityRequirement[],
    updatedSchemes: Record<string, SecurityScheme>,
  ) => void
}

export function SecurityPanel({
  pathName,
  method,
  security,
  securitySchemes,
  otherOperationsSchemeNames,
  onChange,
}: SecurityPanelProps) {
  const [showModal, setShowModal] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [form, setForm] = useState<SecurityFormState>(blankForm())
  const [errors, setErrors] = useState<SecurityFormErrors>({})

  const methodColor = METHOD_COLORS[method] ?? 'bg-gray-100 text-gray-800'

  // The original scheme name being edited (to detect renames)
  const editingOriginalName = editingIndex !== null ? security[editingIndex]?.schemeName : undefined

  // Warning: a scheme with this name exists and is NOT the one we are editing
  const showExistingWarning =
    form.name.trim() !== '' &&
    !errors.name &&
    form.name.trim() !== editingOriginalName &&
    otherOperationsSchemeNames.has(form.name.trim())

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleOpenAdd = () => {
    setForm(blankForm())
    setErrors({})
    setEditingIndex(null)
    setShowModal(true)
  }

  const handleOpenEdit = (idx: number) => {
    const req = security[idx]
    const scheme = securitySchemes[req.schemeName]
    if (!scheme) {
      // Fallback: open with just the name
      setForm({ ...blankForm(), name: req.schemeName })
    } else if (scheme.type !== 'apiKey' && scheme.type !== 'http') {
      // Unsupported – do not open edit
      return
    } else {
      setForm(schemeToForm(req.schemeName, scheme))
    }
    setErrors({})
    setEditingIndex(idx)
    setShowModal(true)
  }

  const handleCancel = () => {
    setShowModal(false)
    setEditingIndex(null)
  }

  const handleSave = () => {
    const errs = validateForm(form, editingOriginalName)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    const newSchemeName = form.name.trim()
    const newScheme = formToScheme(form)

    let updatedSecurity: OperationSecurityRequirement[]
    let updatedSchemes: Record<string, SecurityScheme> = { ...securitySchemes }

    if (editingIndex === null) {
      // Add new
      // Only add if not already in this operation's security list
      if (security.some((s) => s.schemeName === newSchemeName)) {
        setErrors({ name: 'This scheme is already applied to this operation' })
        return
      }
      updatedSecurity = [...security, { schemeName: newSchemeName }]
    } else {
      // Edit existing
      const oldName = editingOriginalName!
      if (oldName !== newSchemeName) {
        // Rename: remove old key, add new key
        const { [oldName]: _removed, ...rest } = updatedSchemes
        updatedSchemes = rest
        // Update the security reference
        updatedSecurity = security.map((s, i) =>
          i === editingIndex ? { schemeName: newSchemeName } : s,
        )
        // If old scheme was not used by other operations, the delete is implicit (already done above)
        // If it was used by others, restore it
        if (otherOperationsSchemeNames.has(oldName)) {
          updatedSchemes[oldName] = securitySchemes[oldName]
        }
      } else {
        // Update in place
        updatedSecurity = [...security]
      }
    }

    updatedSchemes[newSchemeName] = newScheme

    onChange(updatedSecurity, updatedSchemes)
    setShowModal(false)
    setEditingIndex(null)
  }

  const handleDelete = (idx: number) => {
    const req = security[idx]
    const schemeName = req.schemeName
    const updatedSecurity = security.filter((_, i) => i !== idx)
    let updatedSchemes: Record<string, SecurityScheme> = { ...securitySchemes }

    // If the scheme is not used by any other operation, remove it from components
    const stillUsedByCurrentOp = updatedSecurity.some((s) => s.schemeName === schemeName)
    const usedByOther = otherOperationsSchemeNames.has(schemeName)

    if (!stillUsedByCurrentOp && !usedByOther) {
      const { [schemeName]: _removed, ...rest } = updatedSchemes
      updatedSchemes = rest
    }

    onChange(updatedSecurity, updatedSchemes)
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="mt-6 border border-slate-200 rounded-lg bg-white">
      {/* Section Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between rounded-t-lg">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-slate-900">Security</h3>
          <span className={`px-2 py-0.5 rounded text-xs font-bold ${methodColor}`}>{method}</span>
          <span className="text-xs font-mono text-slate-500">{pathName}</span>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Add security
        </button>
      </div>

      {/* List */}
      <div className="px-6 py-4">
        {security.length === 0 ? (
          <p className="text-sm text-slate-400 italic text-center py-4">
            No security requirements defined for this operation.
          </p>
        ) : (
          <div className="space-y-2">
            {security.map((req, idx) => {
              const scheme = securitySchemes[req.schemeName]
              const isMissing = !scheme
              const isUnsupported =
                scheme && scheme.type !== 'apiKey' && scheme.type !== 'http'

              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <code className="text-sm font-mono font-semibold text-slate-900 truncate">
                      {req.schemeName}
                    </code>
                    {isMissing ? (
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-700">
                        ⚠ missing definition
                      </span>
                    ) : isUnsupported ? (
                      <>
                        <SchemeBadge type={scheme.type} />
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-500">
                          read-only (unsupported type)
                        </span>
                      </>
                    ) : (
                      <SchemeBadge type={scheme.type} />
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-3 shrink-0">
                    {!isMissing && !isUnsupported && (
                      <button
                        onClick={() => handleOpenEdit(idx)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Edit"
                        aria-label={`Edit ${req.schemeName}`}
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(idx)}
                      className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete"
                      aria-label={`Delete ${req.schemeName}`}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer note */}
      <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 rounded-b-lg">
        Scheme definitions are stored under <code>components/securitySchemes</code> and shared across all operations.
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <SecurityFormModal
          title={editingIndex === null ? 'Add Security Requirement' : 'Edit Security Requirement'}
          form={form}
          errors={errors}
          showExistingWarning={showExistingWarning}
          onFormChange={setForm}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}
    </div>
  )
}

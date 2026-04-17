/**
 * RequestBodyPanel
 * Tree-based editor for request body parameters per operation.
 * Implements WP-022, WP-023, WP-024, WP-025
 */

import React, { useMemo, useState } from 'react'
import {
  RequestBody,
  BodyParameter,
  BodyParamType,
  BodyParamItemType,
  ObjectBodyParameter,
  ArrayBodyParameter,
  ScalarBodyParameter,
  MEDIA_TYPE_OPTIONS,
} from '../../types'
import {
  buildSchemaRef,
  getSchemaNameFromRef,
  parseEditableObjectSchema,
} from '../../utils/schemaUtils'
import { sortStringsCaseInsensitiveStable } from '../../utils/sortUtils'

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL_PARAM_TYPES: BodyParamType[] = ['string', 'number', 'integer', 'boolean', 'object', 'array']
const ITEM_TYPES: BodyParamItemType[] = ['string', 'number', 'integer', 'boolean', 'object']

const TYPE_COLORS: Record<string, string> = {
  string: 'bg-emerald-100 text-emerald-700',
  number: 'bg-sky-100 text-sky-700',
  integer: 'bg-sky-100 text-sky-700',
  boolean: 'bg-amber-100 text-amber-700',
  object: 'bg-violet-100 text-violet-700',
  array: 'bg-orange-100 text-orange-700',
}

const METHOD_COLORS: Record<string, string> = {
  POST: 'bg-green-100 text-green-800',
  PUT: 'bg-yellow-100 text-yellow-800',
  PATCH: 'bg-purple-100 text-purple-800',
}

// ─── Tree path helpers ────────────────────────────────────────────────────────

function getNodeChildren(param: BodyParameter): BodyParameter[] | undefined {
  if (param.type === 'object') {
    const op = param as ObjectBodyParameter
    if (op.ref) return undefined
    return op.properties
  }
  if (param.type === 'array' && (param as ArrayBodyParameter).itemType === 'object') {
    const ap = param as ArrayBodyParameter
    if (ap.itemRef) return undefined
    return ap.itemProperties ?? []
  }
  return undefined
}

function setNodeChildren(param: BodyParameter, children: BodyParameter[]): BodyParameter {
  if (param.type === 'object') return { ...param, properties: children } as ObjectBodyParameter
  if (param.type === 'array') return { ...param, itemProperties: children } as ArrayBodyParameter
  return param
}

function updateAtPath(params: BodyParameter[], path: number[], newParam: BodyParameter): BodyParameter[] {
  if (path.length === 0) return params
  const [first, ...rest] = path
  return params.map((p, i) => {
    if (i !== first) return p
    if (rest.length === 0) return newParam
    const children = getNodeChildren(p)
    if (!children) return p
    return setNodeChildren(p, updateAtPath(children, rest, newParam))
  })
}

function deleteAtPath(params: BodyParameter[], path: number[]): BodyParameter[] {
  if (path.length === 0) return params
  const [first, ...rest] = path
  if (rest.length === 0) return params.filter((_, i) => i !== first)
  return params.map((p, i) => {
    if (i !== first) return p
    const children = getNodeChildren(p)
    if (!children) return p
    return setNodeChildren(p, deleteAtPath(children, rest))
  })
}

function addAtPath(params: BodyParameter[], parentPath: number[], newParam: BodyParameter): BodyParameter[] {
  if (parentPath.length === 0) return [...params, newParam]
  const [first, ...rest] = parentPath
  return params.map((p, i) => {
    if (i !== first) return p
    if (rest.length === 0) {
      const children = getNodeChildren(p) ?? []
      return setNodeChildren(p, [...children, newParam])
    }
    const children = getNodeChildren(p)
    if (!children) return p
    return setNodeChildren(p, addAtPath(children, rest, newParam))
  })
}

function getChildrenAtPath(params: BodyParameter[], path: number[]): BodyParameter[] {
  if (path.length === 0) return params
  const [first, ...rest] = path
  const node = params[first]
  if (!node) return []
  if (rest.length === 0) return getNodeChildren(node) ?? []
  return getChildrenAtPath(getNodeChildren(node) ?? [], rest)
}

// ─── Form types ───────────────────────────────────────────────────────────────

interface FormState {
  name: string
  type: BodyParamType
  required: boolean
  description: string
  itemType: BodyParamItemType
  objectMode: 'inline' | 'ref'
  schemaRefName: string
  schemaSearch: string
}

interface FormErrors {
  name?: string
}

function blankForm(defaultType: BodyParamType = 'string'): FormState {
  return {
    name: '',
    type: defaultType,
    required: false,
    description: '',
    itemType: 'string',
    objectMode: 'inline',
    schemaRefName: '',
    schemaSearch: '',
  }
}

function paramToForm(param: BodyParameter): FormState {
  if (param.type === 'object') {
    const op = param as ObjectBodyParameter
    return {
      ...blankForm('object'),
      name: param.name,
      required: param.required ?? false,
      description: param.description ?? '',
      objectMode: op.ref ? 'ref' : 'inline',
      schemaRefName: op.ref ? (getSchemaNameFromRef(op.ref) ?? '') : '',
    }
  }
  if (param.type === 'array') {
    const ap = param as ArrayBodyParameter
    return { ...blankForm('array'), name: param.name, required: param.required ?? false, description: param.description ?? '', itemType: ap.itemType }
  }
  return {
    ...blankForm(param.type),
    name: param.name,
    type: param.type,
    required: param.required ?? false,
    description: param.description ?? '',
    itemType: 'string',
  }
}

function formToParam(
  form: FormState,
  existingChildren?: BodyParameter[],
  existingParam?: BodyParameter,
): BodyParameter {
  if (form.type === 'object') {
    if (form.objectMode === 'ref' && form.schemaRefName.trim()) {
      return {
        name: form.name.trim(),
        type: 'object',
        ref: buildSchemaRef(form.schemaRefName.trim()),
        ...(form.required ? { required: true } : {}),
        ...(form.description.trim() ? { description: form.description.trim() } : {}),
        properties: [],
      } as ObjectBodyParameter
    }

    return {
      name: form.name.trim(),
      type: 'object',
      ...(form.required ? { required: true } : {}),
      ...(form.description.trim() ? { description: form.description.trim() } : {}),
      properties: existingChildren ?? [],
    } as ObjectBodyParameter
  }
  if (form.type === 'array') {
    const existingArrayParam =
      existingParam && existingParam.type === 'array' ? (existingParam as ArrayBodyParameter) : undefined

    return {
      name: form.name.trim(),
      type: 'array',
      itemType: form.itemType,
      ...(form.required ? { required: true } : {}),
      ...(form.description.trim() ? { description: form.description.trim() } : {}),
      ...(form.itemType === 'object'
        ? {
            ...(existingArrayParam?.itemRef ? { itemRef: existingArrayParam.itemRef } : {}),
            itemProperties: existingChildren ?? [],
          }
        : {}),
    } as ArrayBodyParameter
  }
  return { name: form.name.trim(), type: form.type as 'string' | 'number' | 'integer' | 'boolean', ...(form.required ? { required: true } : {}), ...(form.description.trim() ? { description: form.description.trim() } : {}) } as ScalarBodyParameter
}

function validateForm(form: FormState, siblings: BodyParameter[], editingName?: string): FormErrors {
  const errors: FormErrors = {}
  if (!form.name.trim()) {
    errors.name = 'Name is required'
  } else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(form.name.trim())) {
    errors.name = 'Name must start with a letter or underscore and contain only letters, digits, and underscores'
  } else {
    const duplicate = siblings.some(s => s.name === form.name.trim() && s.name !== editingName)
    if (duplicate) errors.name = 'A property with this name already exists at this level'
  }

  if (form.type === 'object' && form.objectMode === 'ref' && !form.schemaRefName.trim()) {
    errors.name = errors.name ?? 'Select a schema reference before saving'
  }

  return errors
}

// ─── Edit / Add modal ────────────────────────────────────────────────────────

interface EditModalProps {
  title: string
  form: FormState
  errors: FormErrors
  availableSchemaNames: string[]
  isSchemaMode: boolean
  onFormChange: (form: FormState) => void
  onSave: () => void
  onCancel: () => void
}

function ParamEditModal({
  title,
  form,
  errors,
  availableSchemaNames,
  isSchemaMode,
  onFormChange,
  onSave,
  onCancel,
}: EditModalProps) {
  const set = (partial: Partial<FormState>) => onFormChange({ ...form, ...partial })

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onCancel()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onCancel} onKeyDown={handleKeyDown}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="bg-blue-600 text-white px-6 py-4 rounded-t-xl">
          <h3 className="text-xl font-bold">{title}</h3>
        </div>
        <div className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              className={`w-full px-3 py-2 border rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-400 bg-red-50' : 'border-slate-300'}`}
              value={form.name}
              onChange={e => set({ name: e.target.value })}
              placeholder="propertyName"
              autoFocus
            />
            {errors.name && <p className="mt-1 text-xs text-red-600 font-medium">⚠ {errors.name}</p>}
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Type</label>
            <select
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.type}
              onChange={e => set({ type: e.target.value as BodyParamType, itemType: 'string', objectMode: 'inline', schemaRefName: '', schemaSearch: '' })}
            >
              {ALL_PARAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Object mode selector for WP-037 */}
          {form.type === 'object' && !isSchemaMode && (
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Object Definition Mode</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (form.objectMode === 'ref' && form.schemaRefName.trim()) {
                      const confirmed = window.confirm('Switching to inline mode clears the selected schema reference. Continue?')
                      if (!confirmed) return
                    }
                    set({ objectMode: 'inline', schemaRefName: '', schemaSearch: '' })
                  }}
                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${form.objectMode === 'inline' ? 'bg-blue-50 border-blue-400 text-blue-700' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}`}
                >
                  Define inline
                </button>
                <button
                  type="button"
                  onClick={() => set({ objectMode: 'ref' })}
                  disabled={availableSchemaNames.length === 0}
                  title={availableSchemaNames.length === 0 ? 'Create a schema in the Schemas panel first.' : undefined}
                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${form.objectMode === 'ref' ? 'bg-blue-50 border-blue-400 text-blue-700' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'} ${availableSchemaNames.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Use schema reference ($ref)
                </button>
              </div>

              {form.objectMode === 'ref' && (
                <div className="space-y-2">
                  {availableSchemaNames.length > 5 && (
                    <input
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      value={form.schemaSearch}
                      onChange={e => set({ schemaSearch: e.target.value })}
                      placeholder="Search schemas..."
                    />
                  )}
                  <select
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    value={form.schemaRefName}
                    onChange={e => set({ schemaRefName: e.target.value })}
                  >
                    <option value="">Select a schema...</option>
                    {availableSchemaNames
                      .filter(name =>
                        form.schemaSearch.trim()
                          ? name.toLowerCase().includes(form.schemaSearch.trim().toLowerCase())
                          : true,
                      )
                      .map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                  </select>
                  {availableSchemaNames.length === 0 && (
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                      No schemas available. Create one in the Schemas panel first.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Array item type */}
          {form.type === 'array' && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Element type</label>
              <select
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.itemType}
                onChange={e => set({ itemType: e.target.value as BodyParamItemType })}
              >
                {ITEM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              {form.itemType === 'object' && (
                <p className="mt-1 text-xs text-slate-500">Save and expand the node in the tree to define item properties.</p>
              )}
            </div>
          )}

          {/* Required */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.required}
              onChange={e => set({ required: e.target.checked })}
              className="w-4 h-4 accent-blue-600"
            />
            <span className="text-sm font-semibold text-slate-700">Required</span>
          </label>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={2}
              value={form.description}
              onChange={e => set({ description: e.target.value })}
              placeholder="Describe this property…"
            />
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 rounded-b-xl">
          <button onClick={onCancel} className="px-4 py-2 text-slate-700 hover:bg-slate-200 rounded-lg font-medium transition-colors">
            Cancel
          </button>
          <button onClick={onSave} className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium transition-colors">
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Type badge ───────────────────────────────────────────────────────────────

function TypeBadge({ param }: { param: BodyParameter }) {
  const label = param.type === 'array'
    ? `array of ${(param as ArrayBodyParameter).itemType}`
    : param.type
  const cls = TYPE_COLORS[param.type] ?? 'bg-slate-100 text-slate-700'
  return <span className={`text-xs font-mono px-2 py-0.5 rounded-full font-semibold ${cls}`}>{label}</span>
}

// ─── Tree row ─────────────────────────────────────────────────────────────────

interface TreeRowProps {
  param: BodyParameter
  depth: number
  isExpandable: boolean
  isExpanded: boolean
  readOnly?: boolean
  schemaRefLabel?: string
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}

function TreeRow({ param, depth, isExpandable, isExpanded, readOnly = false, schemaRefLabel, onToggle, onEdit, onDelete }: TreeRowProps) {
  const indent = depth * 20
  return (
    <div className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-slate-50 group" style={{ paddingLeft: `${12 + indent}px` }}>
      <button
        className={`w-5 h-5 flex-shrink-0 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors text-xs ${!isExpandable ? 'invisible' : ''}`}
        onClick={isExpandable ? onToggle : undefined}
        aria-label={isExpanded ? 'Collapse' : 'Expand'}
      >
        {isExpanded ? '▼' : '▶'}
      </button>
      <span className="font-mono font-semibold text-slate-900 flex-1 truncate min-w-0">{param.name}</span>
      <TypeBadge param={param} />
      {schemaRefLabel && (
        <span className="text-[11px] font-mono text-blue-700 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5 flex-shrink-0">
          {schemaRefLabel}
        </span>
      )}
      {param.required && (
        <span className="text-xs font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200 flex-shrink-0">
          required
        </span>
      )}
      {!readOnly && (
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button
            onClick={onEdit}
            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="Edit"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Delete"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}

function AddChildRow({ depth, label, onClick }: { depth: number; label: string; onClick: () => void }) {
  return (
    <div className="flex items-center py-1" style={{ paddingLeft: `${12 + depth * 20 + 28}px` }}>
      <button
        onClick={onClick}
        className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline transition-colors flex items-center gap-1"
      >
        <span className="text-base leading-none">+</span> {label}
      </button>
    </div>
  )
}

// ─── Media type change confirmation modal ─────────────────────────────────────

function MediaTypeChangeModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="bg-amber-500 text-white px-6 py-4 rounded-t-xl">
          <h3 className="text-xl font-bold">Change media type?</h3>
        </div>
        <div className="p-6">
          <p className="text-slate-700">Changing the media type will clear all existing body properties. This action cannot be undone.</p>
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 rounded-b-xl">
          <button onClick={onCancel} className="px-4 py-2 text-slate-700 hover:bg-slate-200 rounded-lg font-medium transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} className="px-4 py-2 bg-amber-500 text-white hover:bg-amber-600 rounded-lg font-medium transition-colors">
            Change & clear
          </button>
        </div>
      </div>
    </div>
  )
}

function CreateSchemaFromInlineModal({
  initialName,
  error,
  onConfirm,
  onCancel,
}: {
  initialName: string
  error: string | null
  onConfirm: (schemaName: string) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(initialName)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="bg-blue-600 text-white px-6 py-4 rounded-t-xl">
          <h3 className="text-xl font-bold">Create reusable schema</h3>
        </div>
        <div className="p-6 space-y-3">
          <p className="text-sm text-slate-700">
            Enter a target schema name in components/schemas. The current inline request body model will be replaced by a $ref.
          </p>
          <input
            className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="UserPayload"
            autoFocus
            onKeyDown={e => {
              if (e.key === 'Enter') onConfirm(name)
              if (e.key === 'Escape') onCancel()
            }}
          />
          {error && (
            <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1">
              {error}
            </p>
          )}
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 rounded-b-xl">
          <button onClick={onCancel} className="px-4 py-2 text-slate-700 hover:bg-slate-200 rounded-lg font-medium transition-colors">
            Cancel
          </button>
          <button onClick={() => onConfirm(name)} className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium transition-colors">
            Create schema
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main RequestBodyPanel ────────────────────────────────────────────────────

interface RequestBodyPanelProps {
  pathName: string
  method: string
  body: RequestBody
  onChange: (body: RequestBody) => void
  schemas?: Record<string, unknown>
  mode?: 'requestBody' | 'schema'
  onCreateSchemaFromInline?: (schemaName: string) => { ok: boolean; error?: string }
}

interface ModalState {
  open: boolean
  mode: 'add' | 'edit'
  path: number[]
  form: FormState
  errors: FormErrors
  originalName?: string
}

export function RequestBodyPanel({
  pathName,
  method,
  body,
  onChange,
  schemas = {},
  mode = 'requestBody',
  onCreateSchemaFromInline,
}: RequestBodyPanelProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [modal, setModal] = useState<ModalState>({ open: false, mode: 'add', path: [], form: blankForm(), errors: {} })
  const [confirmDeletePath, setConfirmDeletePath] = useState<number[] | null>(null)
  const [pendingMediaType, setPendingMediaType] = useState<string | null>(null)
  const [customMediaType, setCustomMediaType] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [schemaActionError, setSchemaActionError] = useState<string | null>(null)
  const [showCreateSchemaModal, setShowCreateSchemaModal] = useState(false)
  const [createSchemaModalError, setCreateSchemaModalError] = useState<string | null>(null)

  const schemaNames = useMemo(() => sortStringsCaseInsensitiveStable(Object.keys(schemas)), [schemas])
  const isSchemaMode = mode === 'schema'
  const isUsingSchemaRef = !isSchemaMode && typeof body.schemaRef === 'string' && body.schemaRef.trim().length > 0
  const schemaRefName = isUsingSchemaRef ? (getSchemaNameFromRef(body.schemaRef as string) ?? body.schemaRef?.trim()) : null

  const methodColor = METHOD_COLORS[method.toUpperCase()] ?? 'bg-slate-100 text-slate-800'

  const toggleExpand = (key: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key); else next.add(key)
      return next
    })
  }

  const openAddModal = (parentPath: number[]) => {
    setModal({ open: true, mode: 'add', path: parentPath, form: blankForm(), errors: {} })
  }

  const openEditModal = (param: BodyParameter, path: number[]) => {
    setModal({ open: true, mode: 'edit', path, form: paramToForm(param), errors: {}, originalName: param.name })
  }

  const closeModal = () => setModal(m => ({ ...m, open: false }))

  const handleModalSave = () => {
    const siblings = getChildrenAtPath(body.properties, modal.mode === 'add' ? modal.path : modal.path.slice(0, -1))
    const editingName = modal.mode === 'edit' ? modal.originalName : undefined
    const errors = validateForm(modal.form, siblings, editingName)

    if (Object.keys(errors).length > 0) {
      setModal(m => ({ ...m, errors }))
      return
    }

    if (modal.mode === 'add') {
      onChange({ ...body, properties: addAtPath(body.properties, modal.path, formToParam(modal.form)) })
      if (modal.path.length > 0) {
        setExpandedNodes(prev => new Set([...prev, modal.path.join('.')]))
      }
    } else {
      const existingNode = getChildrenAtPath(body.properties, modal.path.slice(0, -1))[modal.path[modal.path.length - 1]]
      const existingChildren = existingNode ? getNodeChildren(existingNode) : undefined
      onChange({ ...body, properties: updateAtPath(body.properties, modal.path, formToParam(modal.form, existingChildren, existingNode)) })
    }

    closeModal()
  }

  const handleDelete = (path: number[]) => {
    setConfirmDeletePath(path)
  }

  const confirmDelete = () => {
    if (confirmDeletePath !== null) {
      onChange({ ...body, properties: deleteAtPath(body.properties, confirmDeletePath) })
      setConfirmDeletePath(null)
    }
  }

  const handleMediaTypeChange = (value: string) => {
    if (value === '__custom__') {
      setShowCustomInput(true)
      return
    }
    if (body.properties.length > 0) {
      setPendingMediaType(value)
    } else {
      onChange({ ...body, mediaType: value })
    }
  }

  const confirmMediaTypeChange = () => {
    if (pendingMediaType) {
      onChange({ ...body, mediaType: pendingMediaType, properties: [] })
      setPendingMediaType(null)
    }
  }

  const handleCustomMediaTypeConfirm = () => {
    const trimmed = customMediaType.trim()
    if (!trimmed) return
    if (body.properties.length > 0) {
      setPendingMediaType(trimmed)
    } else {
      onChange({ ...body, mediaType: trimmed })
    }
    setShowCustomInput(false)
    setCustomMediaType('')
  }

  const getReferencePreviewChildren = (ref: string): BodyParameter[] => {
    const schemaName = getSchemaNameFromRef(ref)
    if (!schemaName) return []

    const schema = schemas[schemaName]
    if (!schema) return []

    const parsed = parseEditableObjectSchema(schema)
    return parsed.editable ? parsed.properties : []
  }

  const renderTree = (params: BodyParameter[], parentPath: number[], depth: number): React.ReactNode => {
    return params.map((param, index) => {
      const path = [...parentPath, index]
      const nodeKey = path.join('.')
      const refValue =
        param.type === 'object'
          ? (param as ObjectBodyParameter).ref
          : param.type === 'array' && (param as ArrayBodyParameter).itemType === 'object'
            ? (param as ArrayBodyParameter).itemRef
            : undefined
      const refChildren = refValue ? getReferencePreviewChildren(refValue) : undefined
      const children = refChildren ?? getNodeChildren(param)
      const isRefPreview = !!refValue
      const isExpandable = children !== undefined
      const isExpanded = expandedNodes.has(nodeKey)
      const addChildLabel = param.type === 'array' ? 'Add item property' : 'Add property'
      const schemaName = refValue ? getSchemaNameFromRef(refValue) : null
      const schemaRefLabel = schemaName
        ? param.type === 'array'
          ? `$ref items: ${schemaName}`
          : `$ref: ${schemaName}`
        : undefined

      return (
        <React.Fragment key={nodeKey}>
          <TreeRow
            param={param}
            depth={depth}
            isExpandable={isExpandable}
            isExpanded={isExpanded}
            readOnly={isRefPreview}
            schemaRefLabel={schemaRefLabel}
            onToggle={() => toggleExpand(nodeKey)}
            onEdit={() => openEditModal(param, path)}
            onDelete={() => handleDelete(path)}
          />
          {isExpanded && isExpandable && (
            <>
              {isRefPreview && (
                <div style={{ paddingLeft: `${12 + (depth + 1) * 20 + 28}px` }} className="pb-2">
                  <p className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded px-2 py-1 inline-block">
                    Referenced schema is read-only here. Edit it in the Schemas panel.
                  </p>
                </div>
              )}
              {children!.length > 0
                ? renderTree(children!, path, depth + 1)
                : (
                  <div style={{ paddingLeft: `${12 + (depth + 1) * 20 + 28}px` }} className="py-1">
                    <span className="text-xs text-slate-400 italic">
                      {isRefPreview ? 'No preview available for this schema' : 'No properties yet'}
                    </span>
                  </div>
                )
              }
              {!isRefPreview && <AddChildRow depth={depth + 1} label={addChildLabel} onClick={() => openAddModal(path)} />}
            </>
          )}
        </React.Fragment>
      )
    })
  }

  const isCustomMediaType = !MEDIA_TYPE_OPTIONS.includes(body.mediaType as any)

  const handleCreateSchemaFromInline = () => {
    setSchemaActionError(null)

    if (!onCreateSchemaFromInline) {
      setSchemaActionError('Schema extraction is unavailable here.')
      return
    }

    if (isUsingSchemaRef) {
      setSchemaActionError('This request body already uses a schema reference.')
      return
    }

    setCreateSchemaModalError(null)
    setShowCreateSchemaModal(true)
  }

  const confirmCreateSchemaFromInline = (schemaName: string) => {
    if (!onCreateSchemaFromInline) return

    const result = onCreateSchemaFromInline(schemaName)
    if (!result.ok) {
      setCreateSchemaModalError(result.error ?? 'Failed to create schema from inline model.')
      return
    }

    setShowCreateSchemaModal(false)
    setCreateSchemaModalError(null)
    setSchemaActionError(null)
  }

  return (
    <div className="mt-4 border border-slate-200 rounded-lg overflow-hidden">
      {!isSchemaMode && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-bold text-slate-700 flex-shrink-0">Request Body</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded flex-shrink-0 ${methodColor}`}>
                {method.toUpperCase()}
              </span>
              <span className="text-xs font-mono text-slate-500 truncate">{pathName}</span>
            </div>
          </div>

          {/* Body metadata (WP-023) */}
          <div className="px-4 py-4 border-b border-slate-200 bg-white space-y-4">
            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                value={body.description ?? ''}
                onChange={e => onChange({ ...body, description: e.target.value })}
                placeholder="Describe the request body…"
              />
            </div>

            {/* Required toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={body.required}
                onChange={e => onChange({ ...body, required: e.target.checked })}
                className="w-4 h-4 accent-blue-600"
              />
              <span className="text-sm font-semibold text-slate-700">Required</span>
            </label>

            <div className="pt-1 border-t border-slate-200">
              {isUsingSchemaRef ? (
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded px-2 py-1 font-mono inline-block w-fit">
                    Using schema reference: {schemaRefName}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onChange({ ...body, schemaRef: undefined })}
                      className="px-3 py-1.5 text-xs font-semibold rounded border border-slate-300 text-slate-700 bg-white hover:bg-slate-50"
                    >
                      Switch to inline model
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleCreateSchemaFromInline}
                      disabled={!onCreateSchemaFromInline}
                      className={`px-3 py-1.5 text-xs font-semibold rounded border transition-colors ${onCreateSchemaFromInline ? 'border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100' : 'border-slate-300 text-slate-400 bg-slate-100 cursor-not-allowed'}`}
                    >
                      Create reusable schema from inline model
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">
                    Saves the current inline object as components/schemas and replaces this request body schema with a $ref.
                  </p>
                </div>
              )}
              {schemaActionError && (
                <p className="mt-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1">
                  {schemaActionError}
                </p>
              )}
            </div>
          </div>

          {/* Media type selector (WP-024) */}
          <div className="px-4 py-3 border-b border-slate-200 bg-white">
            <label className="block text-sm font-semibold text-slate-700 mb-1">Media Type</label>
            {showCustomInput ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                  value={customMediaType}
                  onChange={e => setCustomMediaType(e.target.value)}
                  placeholder="e.g. application/vnd.api+json"
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleCustomMediaTypeConfirm()
                    if (e.key === 'Escape') { setShowCustomInput(false); setCustomMediaType('') }
                  }}
                />
                <button
                  onClick={handleCustomMediaTypeConfirm}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
                >
                  Set
                </button>
                <button
                  onClick={() => { setShowCustomInput(false); setCustomMediaType('') }}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex gap-2 items-center">
                <select
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  value={isCustomMediaType ? '__custom_active__' : body.mediaType}
                  onChange={e => handleMediaTypeChange(e.target.value)}
                >
                  {MEDIA_TYPE_OPTIONS.map(mt => (
                    <option key={mt} value={mt}>{mt}</option>
                  ))}
                  {isCustomMediaType && (
                    <option value="__custom_active__">{body.mediaType}</option>
                  )}
                  <option value="__custom__">Custom…</option>
                </select>
                {isCustomMediaType && (
                  <span className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-1 rounded">{body.mediaType}</span>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Properties tree (WP-025) */}
      <div className="px-2 py-2 min-h-[60px]">
        {isUsingSchemaRef ? (
          <div className="py-6 px-3 text-center">
            <p className="text-sm text-slate-600">Inline property editing is disabled while using a schema reference.</p>
            <p className="text-xs text-slate-500 mt-1">Switch back to inline mode to edit properties here.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-2 py-1 mb-1">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Properties</span>
              <button
                onClick={() => openAddModal([])}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors flex items-center gap-1"
              >
                <span className="text-base leading-none">+</span> Add property
              </button>
            </div>
            {body.properties.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-sm text-slate-400 italic">No properties defined.</p>
                <p className="text-xs text-slate-400 mt-1">Click "+ Add property" to get started.</p>
              </div>
            ) : (
              <div>{renderTree(body.properties, [], 0)}</div>
            )}
          </>
        )}
      </div>

      {/* Edit / Add modal */}
      {modal.open && (
        <ParamEditModal
          title={modal.mode === 'add' ? 'Add Body Property' : 'Edit Body Property'}
          form={modal.form}
          errors={modal.errors}
          availableSchemaNames={schemaNames}
          isSchemaMode={isSchemaMode}
          onFormChange={form => setModal(m => ({ ...m, form, errors: {} }))}
          onSave={handleModalSave}
          onCancel={closeModal}
        />
      )}

      {/* Confirm delete modal */}
      {confirmDeletePath !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setConfirmDeletePath(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="bg-red-600 text-white px-6 py-4 rounded-t-xl">
              <h3 className="text-xl font-bold">Delete property</h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-slate-700">Are you sure you want to delete this property and all its children? This action cannot be undone.</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setConfirmDeletePath(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Media type change confirmation */}
      {pendingMediaType !== null && (
        <MediaTypeChangeModal
          onConfirm={confirmMediaTypeChange}
          onCancel={() => setPendingMediaType(null)}
        />
      )}

      {showCreateSchemaModal && (
        <CreateSchemaFromInlineModal
          initialName=""
          error={createSchemaModalError}
          onConfirm={confirmCreateSchemaFromInline}
          onCancel={() => {
            setShowCreateSchemaModal(false)
            setCreateSchemaModalError(null)
          }}
        />
      )}
    </div>
  )
}

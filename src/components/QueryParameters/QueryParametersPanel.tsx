/**
 * QueryParametersPanel
 * Tree-based editor for query parameters per operation.
 * Implements WP-011, WP-014, WP-016, WP-017, WP-021
 */

import React, { useState } from 'react'
import {
  QueryParameter,
  QueryParamType,
  QueryParamItemType,
  ObjectQueryParameter,
  ArrayQueryParameter,
  ScalarQueryParameter,
} from '../../types'

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL_PARAM_TYPES: QueryParamType[] = ['string', 'number', 'integer', 'boolean', 'object', 'array']
const ITEM_TYPES: QueryParamItemType[] = ['string', 'number', 'integer', 'boolean', 'object']

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-blue-100 text-blue-800',
  POST: 'bg-green-100 text-green-800',
  PUT: 'bg-yellow-100 text-yellow-800',
  DELETE: 'bg-red-100 text-red-800',
  PATCH: 'bg-purple-100 text-purple-800',
  HEAD: 'bg-gray-100 text-gray-800',
  OPTIONS: 'bg-indigo-100 text-indigo-800',
}

const TYPE_COLORS: Record<string, string> = {
  string: 'bg-emerald-100 text-emerald-700',
  number: 'bg-sky-100 text-sky-700',
  integer: 'bg-sky-100 text-sky-700',
  boolean: 'bg-amber-100 text-amber-700',
  object: 'bg-violet-100 text-violet-700',
  array: 'bg-orange-100 text-orange-700',
}

// ─── Tree path helpers ────────────────────────────────────────────────────────

function getNodeChildren(param: QueryParameter): QueryParameter[] | undefined {
  if (param.type === 'object') return (param as ObjectQueryParameter).properties
  if (param.type === 'array' && (param as ArrayQueryParameter).itemType === 'object')
    return (param as ArrayQueryParameter).itemProperties ?? []
  return undefined
}

function setNodeChildren(param: QueryParameter, children: QueryParameter[]): QueryParameter {
  if (param.type === 'object') return { ...param, properties: children } as ObjectQueryParameter
  if (param.type === 'array') return { ...param, itemProperties: children } as ArrayQueryParameter
  return param
}

function updateAtPath(params: QueryParameter[], path: number[], newParam: QueryParameter): QueryParameter[] {
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

function deleteAtPath(params: QueryParameter[], path: number[]): QueryParameter[] {
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

function addAtPath(params: QueryParameter[], parentPath: number[], newParam: QueryParameter): QueryParameter[] {
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

function getChildrenAtPath(params: QueryParameter[], path: number[]): QueryParameter[] {
  if (path.length === 0) return params
  const [first, ...rest] = path
  const node = params[first]
  if (!node) return []
  if (rest.length === 0) return getNodeChildren(node) ?? []
  return getChildrenAtPath(getNodeChildren(node) ?? [], rest)
}

// ─── Validation helpers (WP-014) ──────────────────────────────────────────────

function isValidRegex(pattern: string): boolean {
  try { new RegExp(pattern); return true } catch { return false }
}

function validateDefaultValue(value: string, type: string): string | null {
  if (!value.trim()) return null
  if (type === 'number') {
    if (isNaN(Number(value))) return 'Default value must be a valid number'
  } else if (type === 'integer') {
    const n = Number(value)
    if (isNaN(n) || !Number.isInteger(n)) return 'Default value must be a valid integer'
  } else if (type === 'boolean') {
    if (value !== 'true' && value !== 'false') return 'Default value must be "true" or "false"'
  }
  return null
}

// ─── Form types ───────────────────────────────────────────────────────────────

interface FormState {
  name: string
  type: QueryParamType
  required: boolean
  description: string
  defaultValue: string
  pattern: string
  minimum: string
  maximum: string
  itemType: QueryParamItemType
}

interface FormErrors {
  name?: string
  pattern?: string
  minimum?: string
  maximum?: string
  defaultValue?: string
}

function blankForm(defaultType: QueryParamType = 'string'): FormState {
  return { name: '', type: defaultType, required: false, description: '', defaultValue: '', pattern: '', minimum: '', maximum: '', itemType: 'string' }
}

function paramToForm(param: QueryParameter): FormState {
  if (param.type === 'object') {
    return { ...blankForm('object'), name: param.name, required: param.required ?? false, description: param.description ?? '' }
  }
  if (param.type === 'array') {
    const ap = param as ArrayQueryParameter
    return { ...blankForm('array'), name: param.name, required: param.required ?? false, description: param.description ?? '', itemType: ap.itemType }
  }
  const sp = param as ScalarQueryParameter
  return {
    name: sp.name, type: sp.type, required: sp.required ?? false, description: sp.description ?? '',
    defaultValue: sp.defaultValue ?? '', pattern: sp.pattern ?? '',
    minimum: sp.minimum !== undefined ? String(sp.minimum) : '',
    maximum: sp.maximum !== undefined ? String(sp.maximum) : '',
    itemType: 'string',
  }
}

function formToParam(form: FormState, existingChildren?: QueryParameter[]): QueryParameter {
  if (form.type === 'object') {
    return { name: form.name.trim(), type: 'object', ...(form.required ? { required: true } : {}), ...(form.description.trim() ? { description: form.description.trim() } : {}), properties: existingChildren ?? [] } as ObjectQueryParameter
  }
  if (form.type === 'array') {
    return { name: form.name.trim(), type: 'array', itemType: form.itemType, ...(form.required ? { required: true } : {}), ...(form.description.trim() ? { description: form.description.trim() } : {}), ...(form.itemType === 'object' ? { itemProperties: existingChildren ?? [] } : {}) } as ArrayQueryParameter
  }
  const sp: ScalarQueryParameter = { name: form.name.trim(), type: form.type as 'string' | 'number' | 'integer' | 'boolean', ...(form.required ? { required: true } : {}), ...(form.description.trim() ? { description: form.description.trim() } : {}) }
  if (form.defaultValue.trim()) sp.defaultValue = form.defaultValue.trim()
  if (form.type === 'string' && form.pattern.trim()) sp.pattern = form.pattern.trim()
  if ((form.type === 'number' || form.type === 'integer') && form.minimum.trim() !== '') sp.minimum = Number(form.minimum)
  if ((form.type === 'number' || form.type === 'integer') && form.maximum.trim() !== '') sp.maximum = Number(form.maximum)
  return sp
}

function validateForm(form: FormState, siblings: QueryParameter[], editingName?: string): FormErrors {
  const errors: FormErrors = {}
  if (!form.name.trim()) {
    errors.name = 'Name is required'
  } else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(form.name.trim())) {
    errors.name = 'Name must start with a letter or underscore and contain only letters, digits, and underscores'
  } else {
    const duplicate = siblings.some(s => s.name === form.name.trim() && s.name !== editingName)
    if (duplicate) errors.name = 'A parameter with this name already exists at this level'
  }
  if (form.type === 'string' && form.pattern.trim() && !isValidRegex(form.pattern.trim())) {
    errors.pattern = 'Invalid regular expression pattern'
  }
  if ((form.type === 'number' || form.type === 'integer') && form.minimum.trim() !== '' && isNaN(Number(form.minimum))) {
    errors.minimum = 'Must be a valid number'
  }
  if ((form.type === 'number' || form.type === 'integer') && form.maximum.trim() !== '' && isNaN(Number(form.maximum))) {
    errors.maximum = 'Must be a valid number'
  }
  if ((form.type === 'number' || form.type === 'integer') && form.minimum.trim() !== '' && form.maximum.trim() !== '' && !errors.minimum && !errors.maximum) {
    if (Number(form.minimum) > Number(form.maximum)) {
      errors.minimum = 'Minimum cannot be greater than maximum'
      errors.maximum = 'Maximum cannot be less than minimum'
    }
  }
  const dvErr = (form.type !== 'object' && form.type !== 'array') ? validateDefaultValue(form.defaultValue, form.type) : null
  if (dvErr) errors.defaultValue = dvErr
  return errors
}

// ─── Edit / Add modal (WP-014 inline validation) ──────────────────────────────

interface EditModalProps {
  title: string
  form: FormState
  errors: FormErrors
  onFormChange: (form: FormState) => void
  onSave: () => void
  onCancel: () => void
}

function ParamEditModal({ title, form, errors, onFormChange, onSave, onCancel }: EditModalProps) {
  const set = (partial: Partial<FormState>) => onFormChange({ ...form, ...partial })
  const isScalar = form.type !== 'object' && form.type !== 'array'
  const isNumeric = form.type === 'number' || form.type === 'integer'

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
              placeholder="parameterName"
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
              onChange={e => set({ type: e.target.value as QueryParamType, defaultValue: '', pattern: '', minimum: '', maximum: '', itemType: 'string' })}
            >
              {ALL_PARAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Array item type (WP-017) */}
          {form.type === 'array' && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Element type</label>
              <select
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.itemType}
                onChange={e => set({ itemType: e.target.value as QueryParamItemType })}
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
              placeholder="Describe this parameter…"
            />
          </div>

          {/* Scalar-specific fields (WP-014) */}
          {isScalar && (
            <>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Default value</label>
                <input
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono ${errors.defaultValue ? 'border-red-400 bg-red-50' : 'border-slate-300'}`}
                  value={form.defaultValue}
                  onChange={e => set({ defaultValue: e.target.value })}
                  placeholder={form.type === 'boolean' ? 'true or false' : form.type === 'integer' ? '0' : 'optional'}
                />
                {errors.defaultValue && <p className="mt-1 text-xs text-red-600 font-medium">⚠ {errors.defaultValue}</p>}
              </div>

              {form.type === 'string' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Pattern (regex)</label>
                  <input
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono ${errors.pattern ? 'border-red-400 bg-red-50' : 'border-slate-300'}`}
                    value={form.pattern}
                    onChange={e => set({ pattern: e.target.value })}
                    placeholder="e.g. ^[a-z]+$"
                  />
                  {errors.pattern && <p className="mt-1 text-xs text-red-600 font-medium">⚠ {errors.pattern}</p>}
                </div>
              )}

              {isNumeric && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Minimum</label>
                    <input
                      type="number"
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.minimum ? 'border-red-400 bg-red-50' : 'border-slate-300'}`}
                      value={form.minimum}
                      onChange={e => set({ minimum: e.target.value })}
                      placeholder="optional"
                    />
                    {errors.minimum && <p className="mt-1 text-xs text-red-600 font-medium">⚠ {errors.minimum}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Maximum</label>
                    <input
                      type="number"
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.maximum ? 'border-red-400 bg-red-50' : 'border-slate-300'}`}
                      value={form.maximum}
                      onChange={e => set({ maximum: e.target.value })}
                      placeholder="optional"
                    />
                    {errors.maximum && <p className="mt-1 text-xs text-red-600 font-medium">⚠ {errors.maximum}</p>}
                  </div>
                </div>
              )}
            </>
          )}
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

function TypeBadge({ param }: { param: QueryParameter }) {
  const label = param.type === 'array'
    ? `array of ${(param as ArrayQueryParameter).itemType}`
    : param.type
  const cls = TYPE_COLORS[param.type] ?? 'bg-slate-100 text-slate-700'
  return <span className={`text-xs font-mono px-2 py-0.5 rounded-full font-semibold ${cls}`}>{label}</span>
}

// ─── Tree row (WP-021) ────────────────────────────────────────────────────────

interface TreeRowProps {
  param: QueryParameter
  depth: number
  isExpandable: boolean
  isExpanded: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}

function TreeRow({ param, depth, isExpandable, isExpanded, onToggle, onEdit, onDelete }: TreeRowProps) {
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

      {param.required && (
        <span className="text-xs font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200 flex-shrink-0">
          required
        </span>
      )}

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
    </div>
  )
}

// ─── Add child row ────────────────────────────────────────────────────────────

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

// ─── Main QueryParametersPanel (WP-011, WP-021) ───────────────────────────────

interface QueryParametersPanelProps {
  pathName: string
  method: string
  parameters: QueryParameter[]
  onChange: (parameters: QueryParameter[]) => void
}

interface ModalState {
  open: boolean
  mode: 'add' | 'edit'
  path: number[]
  form: FormState
  errors: FormErrors
}

export function QueryParametersPanel({ pathName, method, parameters, onChange }: QueryParametersPanelProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [modal, setModal] = useState<ModalState>({ open: false, mode: 'add', path: [], form: blankForm(), errors: {} })

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

  const openEditModal = (param: QueryParameter, path: number[]) => {
    setModal({ open: true, mode: 'edit', path, form: paramToForm(param), errors: {} })
  }

  const closeModal = () => setModal(m => ({ ...m, open: false }))

  const handleModalSave = () => {
    const siblings = getChildrenAtPath(parameters, modal.mode === 'add' ? modal.path : modal.path.slice(0, -1))
    const editingName = modal.mode === 'edit' ? modal.form.name : undefined
    const errors = validateForm(modal.form, siblings, editingName)

    if (Object.keys(errors).length > 0) {
      setModal(m => ({ ...m, errors }))
      return
    }

    if (modal.mode === 'add') {
      onChange(addAtPath(parameters, modal.path, formToParam(modal.form)))
      if (modal.path.length > 0) {
        setExpandedNodes(prev => new Set([...prev, modal.path.join('.')]))
      }
    } else {
      // Preserve existing children when editing an expandable node
      const existingNode = getChildrenAtPath(parameters, modal.path.slice(0, -1))[modal.path[modal.path.length - 1]]
      const existingChildren = existingNode ? getNodeChildren(existingNode) : undefined
      onChange(updateAtPath(parameters, modal.path, formToParam(modal.form, existingChildren)))
    }

    closeModal()
  }

  const handleDelete = (path: number[]) => {
    onChange(deleteAtPath(parameters, path))
  }

  const renderTree = (params: QueryParameter[], parentPath: number[], depth: number): React.ReactNode => {
    return params.map((param, index) => {
      const path = [...parentPath, index]
      const nodeKey = path.join('.')
      const children = getNodeChildren(param)
      const isExpandable = children !== undefined
      const isExpanded = expandedNodes.has(nodeKey)
      const addChildLabel = param.type === 'array' ? 'Add item property' : 'Add property'

      return (
        <React.Fragment key={nodeKey}>
          <TreeRow
            param={param}
            depth={depth}
            isExpandable={isExpandable}
            isExpanded={isExpanded}
            onToggle={() => toggleExpand(nodeKey)}
            onEdit={() => openEditModal(param, path)}
            onDelete={() => handleDelete(path)}
          />
          {isExpanded && isExpandable && (
            <>
              {children!.length > 0
                ? renderTree(children!, path, depth + 1)
                : (
                  <div style={{ paddingLeft: `${12 + (depth + 1) * 20 + 28}px` }} className="py-1">
                    <span className="text-xs text-slate-400 italic">No properties yet</span>
                  </div>
                )
              }
              <AddChildRow depth={depth + 1} label={addChildLabel} onClick={() => openAddModal(path)} />
            </>
          )}
        </React.Fragment>
      )
    })
  }

  return (
    <div className="mt-4 border border-slate-200 rounded-lg overflow-hidden">
      {/* Header with operation context */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-bold text-slate-700 flex-shrink-0">Query Parameters</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded flex-shrink-0 ${methodColor}`}>
            {method.toUpperCase()}
          </span>
          <span className="text-xs font-mono text-slate-500 truncate">{pathName}</span>
        </div>
        <button
          onClick={() => openAddModal([])}
          className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors flex items-center gap-1 flex-shrink-0 ml-2"
        >
          <span className="text-base leading-none">+</span> Add parameter
        </button>
      </div>

      {/* Tree */}
      <div className="px-2 py-2 min-h-[60px]">
        {parameters.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-sm text-slate-400 italic">No query parameters defined.</p>
            <p className="text-xs text-slate-400 mt-1">Click "+ Add parameter" to get started.</p>
          </div>
        ) : (
          <div>{renderTree(parameters, [], 0)}</div>
        )}
      </div>

      {/* Edit / Add modal */}
      {modal.open && (
        <ParamEditModal
          title={modal.mode === 'add' ? 'Add Query Parameter' : 'Edit Query Parameter'}
          form={modal.form}
          errors={modal.errors}
          onFormChange={form => setModal(m => ({ ...m, form, errors: {} }))}
          onSave={handleModalSave}
          onCancel={closeModal}
        />
      )}
    </div>
  )
}

import React, { useMemo, useState } from 'react'
import { RequestBody } from '../../types'
import { RequestBodyPanel } from '../RequestBody/RequestBodyPanel'
import { sortStringsCaseInsensitiveStable } from '../../utils/sortUtils'
import {
  buildObjectSchemaFromProperties,
  buildSchemaRef,
  getSchemaNameFromRef,
  parseEditableObjectSchema,
} from '../../utils/schemaUtils'

type ModelSource = 'none' | 'inline' | 'ref' | 'unsupported'

interface ResponsesPanelProps {
  pathName: string
  method: string
  responses: Record<string, unknown>
  schemas?: Record<string, unknown>
  responseComponents?: Record<string, unknown>
  onChange: (responses: Record<string, unknown>) => void
  onOpenSchemaRef?: (schemaName: string) => void
}

interface ResponseRow {
  id: string
  statusCode: string
  mediaType: string | null
  description: string
  source: ModelSource
  schemaRefName: string
  inlineBody: RequestBody
  schemaValue: unknown
  mediaEntryExtras: Record<string, unknown>
  readOnlyReason?: string
  missingRef?: boolean
}

interface EditorState {
  open: boolean
  mode: 'add' | 'edit'
  error: string | null
  duplicateError: string | null
  rowId: string | null
  originalStatusCode: string | null
  originalMediaType: string | null
  statusCode: string
  mediaType: string
  description: string
  source: ModelSource
  schemaRefName: string
  inlineBody: RequestBody
  preservedSchema: unknown
  mediaEntryExtras: Record<string, unknown>
}

const STATUS_RE = /^(?:[1-5][0-9][0-9]|default)$/
const DEFAULT_DESCRIPTION = 'Response'

const sortStatusCodes = (codes: string[]) => {
  return [...codes].sort((a, b) => {
    if (a === 'default') return 1
    if (b === 'default') return -1
    return Number(a) - Number(b)
  })
}

const blankBody = (): RequestBody => ({
  required: false,
  mediaType: 'application/json',
  properties: [],
})

const blankEditor = (): EditorState => ({
  open: false,
  mode: 'add',
  error: null,
  duplicateError: null,
  rowId: null,
  originalStatusCode: null,
  originalMediaType: null,
  statusCode: '200',
  mediaType: 'application/json',
  description: '',
  source: 'none',
  schemaRefName: '',
  inlineBody: blankBody(),
  preservedSchema: undefined,
  mediaEntryExtras: {},
})

function normalizeMediaEntryExtras(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const cloned = { ...(value as Record<string, unknown>) }
  delete cloned.schema
  return cloned
}

function parseModelSource(
  schemaValue: unknown,
  schemas: Record<string, unknown>,
): {
  source: ModelSource
  schemaRefName: string
  inlineBody: RequestBody
  readOnlyReason?: string
  missingRef?: boolean
} {
  if (!schemaValue || typeof schemaValue !== 'object' || Array.isArray(schemaValue)) {
    return {
      source: 'none',
      schemaRefName: '',
      inlineBody: blankBody(),
    }
  }

  const schemaObj = schemaValue as Record<string, unknown>

  if (typeof schemaObj.$ref === 'string') {
    const schemaRefName = getSchemaNameFromRef(schemaObj.$ref) ?? ''
    const missingRef = !!schemaRefName && !schemas[schemaRefName]
    return {
      source: 'ref',
      schemaRefName,
      inlineBody: blankBody(),
      missingRef,
    }
  }

  const parsed = parseEditableObjectSchema(schemaObj)
  if (parsed.editable) {
    return {
      source: 'inline',
      schemaRefName: '',
      inlineBody: {
        required: false,
        mediaType: 'application/json',
        properties: parsed.properties,
      },
    }
  }

  return {
    source: 'unsupported',
    schemaRefName: '',
    inlineBody: blankBody(),
    readOnlyReason: parsed.reason ?? 'Unsupported schema shape for visual editing.',
  }
}

function flattenResponses(
  responses: Record<string, unknown>,
  schemas: Record<string, unknown>,
  responseComponents: Record<string, unknown>,
): ResponseRow[] {
  const rows: ResponseRow[] = []

  for (const statusCode of sortStatusCodes(Object.keys(responses))) {
    const rawResponse = responses[statusCode]
    if (!rawResponse || typeof rawResponse !== 'object' || Array.isArray(rawResponse)) {
      rows.push({
        id: `${statusCode}::`,
        statusCode,
        mediaType: null,
        description: '',
        source: 'unsupported',
        schemaRefName: '',
        inlineBody: blankBody(),
        schemaValue: undefined,
        mediaEntryExtras: {},
        readOnlyReason: 'Response entry is not an object and cannot be edited visually.',
      })
      continue
    }

    const responseObj = rawResponse as Record<string, unknown>
    const responseRef = typeof responseObj.$ref === 'string' ? responseObj.$ref : null
    const responseComponentName = responseRef?.match(/^#\/components\/responses\/([^/]+)$/)?.[1]
    const resolvedComponent =
      responseComponentName &&
      responseComponents[responseComponentName] &&
      typeof responseComponents[responseComponentName] === 'object' &&
      !Array.isArray(responseComponents[responseComponentName])
        ? (responseComponents[responseComponentName] as Record<string, unknown>)
        : null

    const effectiveResponseObj = resolvedComponent ?? responseObj
    const description =
      typeof effectiveResponseObj.description === 'string' ? effectiveResponseObj.description : ''
    const content = effectiveResponseObj.content

    if (!content || typeof content !== 'object' || Array.isArray(content)) {
      rows.push({
        id: `${statusCode}::`,
        statusCode,
        mediaType: null,
        description,
        source: 'none',
        schemaRefName: '',
        inlineBody: blankBody(),
        schemaValue: undefined,
        mediaEntryExtras: {},
        ...(responseRef
          ? {
              readOnlyReason: responseComponentName
                ? `Response references #/components/responses/${responseComponentName}, but no editable content schema was found.`
                : 'Response uses an unsupported $ref format.',
            }
          : {}),
      })
      continue
    }

    const mediaEntries = Object.entries(content as Record<string, unknown>)
    if (mediaEntries.length === 0) {
      rows.push({
        id: `${statusCode}::`,
        statusCode,
        mediaType: null,
        description,
        source: 'none',
        schemaRefName: '',
        inlineBody: blankBody(),
        schemaValue: undefined,
        mediaEntryExtras: {},
      })
      continue
    }

    for (const [mediaType, mediaEntry] of mediaEntries.sort((a, b) => a[0].localeCompare(b[0]))) {
      if (!mediaEntry || typeof mediaEntry !== 'object' || Array.isArray(mediaEntry)) {
        rows.push({
          id: `${statusCode}::${mediaType}`,
          statusCode,
          mediaType,
          description,
          source: 'unsupported',
          schemaRefName: '',
          inlineBody: blankBody(),
          schemaValue: undefined,
          mediaEntryExtras: {},
          readOnlyReason: 'Media type entry is not an object and cannot be edited visually.',
        })
        continue
      }

      const mediaObj = mediaEntry as Record<string, unknown>
      const schemaValue = mediaObj.schema
      const model = parseModelSource(schemaValue, schemas)

      rows.push({
        id: `${statusCode}::${mediaType}`,
        statusCode,
        mediaType,
        description,
        source: model.source,
        schemaRefName: model.schemaRefName,
        inlineBody: model.inlineBody,
        schemaValue,
        mediaEntryExtras: normalizeMediaEntryExtras(mediaObj),
        readOnlyReason: model.readOnlyReason,
        missingRef: model.missingRef,
      })
    }
  }

  return rows
}

function clearExistingMedia(
  responses: Record<string, unknown>,
  statusCode: string,
  mediaType: string | null,
): Record<string, unknown> {
  const next = { ...responses }
  const raw = next[statusCode]
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    delete next[statusCode]
    return next
  }

  if (!mediaType) {
    delete next[statusCode]
    return next
  }

  const responseObj = { ...(raw as Record<string, unknown>) }
  const content = responseObj.content

  if (content && typeof content === 'object' && !Array.isArray(content)) {
    const updatedContent = { ...(content as Record<string, unknown>) }
    delete updatedContent[mediaType]

    if (Object.keys(updatedContent).length > 0) {
      responseObj.content = updatedContent
      next[statusCode] = responseObj
      return next
    }
  }

  delete next[statusCode]
  return next
}

function renderSchemaTree(properties: RequestBody['properties'], depth = 0): React.ReactNode {
  return properties.map((param, idx) => {
    const key = `${depth}-${idx}-${param.name}`
    const label =
      param.type === 'array'
        ? `array<${param.itemType}>`
        : param.type

    return (
      <div key={key} className="mt-1" style={{ marginLeft: `${depth * 16}px` }}>
        <div className="flex items-center gap-2 text-sm">
          <span className="font-mono text-slate-900">{param.name}</span>
          <span className="text-xs font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">{label}</span>
          {param.required && <span className="text-[11px] text-red-600 font-semibold">required</span>}
        </div>

        {param.type === 'object' && 'ref' in param && param.ref && (
          <div className="text-xs text-blue-700 font-mono ml-2 mt-0.5">{param.ref}</div>
        )}

        {param.type === 'object' && (!('ref' in param) || !param.ref) && renderSchemaTree(param.properties, depth + 1)}
        {param.type === 'array' && param.itemType === 'object' && renderSchemaTree(param.itemProperties ?? [], depth + 1)}
      </div>
    )
  })
}

function EditorModal({
  state,
  schemaNames,
  readOnlyReason,
  onClose,
  onSave,
  onChange,
}: {
  state: EditorState
  schemaNames: string[]
  readOnlyReason?: string
  onClose: () => void
  onSave: () => void
  onChange: (next: EditorState) => void
}) {
  if (!state.open) return null

  const set = (partial: Partial<EditorState>) =>
    onChange({ ...state, ...partial, error: null, duplicateError: null })

  const canEditModel = state.source !== 'unsupported'

  const confirmSwitchToRef = () => {
    if (state.source === 'inline' && state.inlineBody.properties.length > 0) {
      const ok = window.confirm('Switching to schema reference will replace the current inline schema. Continue?')
      if (!ok) return
    }
    set({ source: 'ref' })
  }

  const confirmSwitchToInline = () => {
    if (state.source === 'ref' && state.schemaRefName.trim()) {
      const ok = window.confirm('Switching to inline schema will replace the current schema reference. Continue?')
      if (!ok) return
    }
    set({ source: 'inline', schemaRefName: '' })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-blue-600 text-white px-6 py-4 rounded-t-xl">
          <h3 className="text-xl font-bold">
            {state.mode === 'add' ? 'Add Response' : 'Edit Response'}
          </h3>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Status code <span className="text-red-500">*</span>
              </label>
              <input
                value={state.statusCode}
                onChange={(e) => set({ statusCode: e.target.value.trim().toLowerCase() === 'default' ? 'default' : e.target.value.trim() })}
                placeholder="200 or default"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Media type <span className="text-red-500">*</span>
              </label>
              <input
                value={state.mediaType}
                onChange={(e) => set({ mediaType: e.target.value })}
                placeholder="application/json"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
            <input
              value={state.description}
              onChange={(e) => set({ description: e.target.value })}
              placeholder="Describe this response"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="border border-slate-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-slate-700 mb-2">Model source</p>

            {canEditModel ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => set({ source: 'none', schemaRefName: '', inlineBody: blankBody() })}
                  className={`px-3 py-2 text-sm rounded border transition-colors ${state.source === 'none' ? 'bg-blue-50 border-blue-400 text-blue-700' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}`}
                >
                  No model
                </button>
                <button
                  type="button"
                  onClick={confirmSwitchToInline}
                  className={`px-3 py-2 text-sm rounded border transition-colors ${state.source === 'inline' ? 'bg-blue-50 border-blue-400 text-blue-700' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}`}
                >
                  Inline schema
                </button>
                <button
                  type="button"
                  onClick={confirmSwitchToRef}
                  className={`px-3 py-2 text-sm rounded border transition-colors ${state.source === 'ref' ? 'bg-blue-50 border-blue-400 text-blue-700' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}`}
                >
                  Schema reference
                </button>
              </div>
            ) : (
              <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 mb-3">
                Read-only model: {readOnlyReason}
              </div>
            )}

            {state.source === 'ref' && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Schema</label>
                <select
                  value={state.schemaRefName}
                  onChange={(e) => set({ schemaRefName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select schema...</option>
                  {schemaNames.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
            )}

            {state.source === 'inline' && (
              <RequestBodyPanel
                pathName="responses"
                method="SCHEMA"
                mode="schema"
                body={state.inlineBody}
                onChange={(body) => set({ inlineBody: body })}
              />
            )}
          </div>

          {(state.error || state.duplicateError) && (
            <div className="p-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm">
              {state.error ?? state.duplicateError}
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-700 hover:bg-slate-200 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium transition-colors"
          >
            Save response
          </button>
        </div>
      </div>
    </div>
  )
}

export function ResponsesPanel({
  pathName,
  method,
  responses,
  schemas = {},
  responseComponents = {},
  onChange,
  onOpenSchemaRef,
}: ResponsesPanelProps) {
  const rows = useMemo(
    () => flattenResponses(responses, schemas, responseComponents),
    [responses, schemas, responseComponents],
  )
  const schemaNames = useMemo(
    () => sortStringsCaseInsensitiveStable(Object.keys(schemas)),
    [schemas],
  )

  const [editor, setEditor] = useState<EditorState>(blankEditor())
  const [deleteTarget, setDeleteTarget] = useState<{ statusCode: string; mediaType: string | null } | null>(null)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [schemaNavigationMessage, setSchemaNavigationMessage] = useState<string | null>(null)

  const openAdd = () => {
    setEditor({
      ...blankEditor(),
      open: true,
      mode: 'add',
    })
  }

  const openEdit = (row: ResponseRow) => {
    setEditor({
      ...blankEditor(),
      open: true,
      mode: 'edit',
      rowId: row.id,
      originalStatusCode: row.statusCode,
      originalMediaType: row.mediaType,
      statusCode: row.statusCode,
      mediaType: row.mediaType ?? 'application/json',
      description: row.description,
      source: row.source,
      schemaRefName: row.schemaRefName,
      inlineBody: row.inlineBody,
      preservedSchema: row.schemaValue,
      mediaEntryExtras: row.mediaEntryExtras,
    })
  }

  const closeEditor = () => {
    setEditor(blankEditor())
  }

  const ensureUnique = (statusCode: string, mediaType: string): boolean => {
    const existing = rows.find((row) => {
      if (!row.mediaType) return false
      if (row.statusCode !== statusCode || row.mediaType !== mediaType) return false

      if (editor.mode === 'edit') {
        return !(row.statusCode === editor.originalStatusCode && row.mediaType === editor.originalMediaType)
      }

      return true
    })

    if (existing) {
      setEditor((prev) => ({
        ...prev,
        duplicateError: `Response ${statusCode} + ${mediaType} already exists for this operation.`,
      }))
      return false
    }

    return true
  }

  const handleSave = () => {
    const statusCode = editor.statusCode.trim().toLowerCase() === 'default'
      ? 'default'
      : editor.statusCode.trim()
    const mediaType = editor.mediaType.trim()
    const description = editor.description.trim()

    if (!STATUS_RE.test(statusCode)) {
      setEditor((prev) => ({
        ...prev,
        error: 'Status code must be 100-599 or default.',
      }))
      return
    }

    if (!mediaType) {
      setEditor((prev) => ({
        ...prev,
        error: 'Media type is required.',
      }))
      return
    }

    if (editor.source === 'ref' && !editor.schemaRefName.trim()) {
      setEditor((prev) => ({
        ...prev,
        error: 'Select a schema reference before saving.',
      }))
      return
    }

    if (!ensureUnique(statusCode, mediaType)) return

    let nextResponses: Record<string, unknown> = { ...responses }
    if (editor.mode === 'edit' && editor.originalStatusCode) {
      nextResponses = clearExistingMedia(
        nextResponses,
        editor.originalStatusCode,
        editor.originalMediaType,
      )
    }

    const currentStatusRaw = nextResponses[statusCode]
    const currentStatusObj =
      currentStatusRaw && typeof currentStatusRaw === 'object' && !Array.isArray(currentStatusRaw)
        ? { ...(currentStatusRaw as Record<string, unknown>) }
        : {}

    const existingContent = currentStatusObj.content
    const content =
      existingContent && typeof existingContent === 'object' && !Array.isArray(existingContent)
        ? { ...(existingContent as Record<string, unknown>) }
        : {}

    const mediaObject: Record<string, unknown> = {
      ...editor.mediaEntryExtras,
    }

    if (editor.source === 'inline') {
      mediaObject.schema = buildObjectSchemaFromProperties(editor.inlineBody.properties)
    } else if (editor.source === 'ref') {
      mediaObject.schema = { $ref: buildSchemaRef(editor.schemaRefName.trim()) }
    } else if (editor.source === 'unsupported') {
      if (editor.preservedSchema !== undefined) {
        mediaObject.schema = editor.preservedSchema
      }
    }

    content[mediaType] = mediaObject
    currentStatusObj.content = content
    currentStatusObj.description = description || DEFAULT_DESCRIPTION

    nextResponses[statusCode] = currentStatusObj
    onChange(nextResponses)
    closeEditor()
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    const next = clearExistingMedia(responses, deleteTarget.statusCode, deleteTarget.mediaType)
    onChange(next)
    setDeleteTarget(null)
  }

  const groupedRows = useMemo(() => {
    const byStatus: Record<string, ResponseRow[]> = {}
    for (const row of rows) {
      if (!byStatus[row.statusCode]) byStatus[row.statusCode] = []
      byStatus[row.statusCode].push(row)
    }
    return sortStatusCodes(Object.keys(byStatus)).map((statusCode) => ({
      statusCode,
      rows: byStatus[statusCode],
    }))
  }, [rows])

  const toggleRowExpanded = (rowId: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(rowId)) next.delete(rowId)
      else next.add(rowId)
      return next
    })
  }

  const handleOpenSchemaReference = (row: ResponseRow) => {
    if (row.source !== 'ref' || !row.schemaRefName) return

    if (!schemas[row.schemaRefName]) {
      setSchemaNavigationMessage(
        `Schema \"${row.schemaRefName}\" does not exist in components/schemas and cannot be opened.`,
      )
      return
    }

    setSchemaNavigationMessage(null)
    onOpenSchemaRef?.(row.schemaRefName)
  }

  const renderExpandedStructure = (row: ResponseRow) => {
    if (row.source === 'none') {
      return <p className="text-sm text-slate-500 italic">No response schema is defined for this media type.</p>
    }

    if (row.source === 'unsupported') {
      return (
        <p className="text-sm text-amber-700">
          This response schema uses an unsupported structure and cannot be rendered as a field tree.
        </p>
      )
    }

    if (row.source === 'inline') {
      if (row.inlineBody.properties.length === 0) {
        return <p className="text-sm text-slate-500 italic">Inline object schema has no properties.</p>
      }
      return <div>{renderSchemaTree(row.inlineBody.properties)}</div>
    }

    if (row.source === 'ref') {
      if (!row.schemaRefName) {
        return <p className="text-sm text-amber-700">Schema reference is empty for this response.</p>
      }

      const referencedSchema = schemas[row.schemaRefName]
      if (!referencedSchema) {
        return (
          <p className="text-sm text-amber-700">
            Referenced schema <span className="font-mono">{row.schemaRefName}</span> was not found in components/schemas.
          </p>
        )
      }

      const parsed = parseEditableObjectSchema(referencedSchema)
      if (!parsed.editable) {
        return (
          <p className="text-sm text-amber-700">
            Referenced schema <span className="font-mono">{row.schemaRefName}</span> cannot be previewed as a field tree: {parsed.reason}
          </p>
        )
      }

      if (parsed.properties.length === 0) {
        return (
          <p className="text-sm text-slate-500 italic">
            Referenced schema <span className="font-mono">{row.schemaRefName}</span> has no properties.
          </p>
        )
      }

      return <div>{renderSchemaTree(parsed.properties)}</div>
    }

    return null
  }

  return (
    <div className="mt-4 border border-slate-200 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-bold text-slate-700 flex-shrink-0">Responses</span>
          <span className="text-xs font-bold px-2 py-0.5 rounded flex-shrink-0 bg-indigo-100 text-indigo-800">
            {method.toUpperCase()}
          </span>
          <span className="text-xs font-mono text-slate-500 truncate">{pathName}</span>
        </div>
        <button
          onClick={openAdd}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + Add Response
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="p-8 text-center bg-white">
          <p className="text-slate-600 font-medium mb-2">No responses defined for this operation.</p>
          <button
            onClick={openAdd}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Add first response
          </button>
        </div>
      ) : (
        <div className="p-4 bg-white space-y-3">
          {schemaNavigationMessage && (
            <div className="p-3 rounded border border-amber-200 bg-amber-50 text-amber-800 text-sm">
              {schemaNavigationMessage}
            </div>
          )}

          {groupedRows.map((group) => (
            <div key={group.statusCode} className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="font-mono text-sm font-semibold text-slate-900">{group.statusCode}</div>
                <div className="text-xs text-slate-500">{group.rows.length} media type{group.rows.length > 1 ? 's' : ''}</div>
              </div>

              <div className="divide-y divide-slate-100">
                {group.rows.map((row) => {
                  const isExpanded = expandedRows.has(row.id)
                  return (
                  <div key={row.id} className="px-3 py-3">
                    <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleRowExpanded(row.id)}
                          className="text-xs px-2 py-0.5 rounded border border-slate-300 text-slate-600 hover:bg-slate-100"
                          aria-expanded={isExpanded}
                          aria-label={isExpanded ? 'Collapse response structure' : 'Expand response structure'}
                        >
                          {isExpanded ? 'Hide structure' : 'Show structure'}
                        </button>
                        <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                          {row.mediaType ?? '(no media type)'}
                        </span>
                        {row.source === 'inline' && (
                          <span className="text-[11px] bg-violet-100 text-violet-800 px-2 py-0.5 rounded">inline</span>
                        )}
                        {row.source === 'ref' && (
                          <span className="text-[11px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                            $ref {row.schemaRefName ? `(${row.schemaRefName})` : ''}
                          </span>
                        )}
                        {row.source === 'none' && (
                          <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded">no model</span>
                        )}
                        {row.source === 'unsupported' && (
                          <span className="text-[11px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded">read-only model</span>
                        )}
                        {row.missingRef && (
                          <span className="text-[11px] bg-red-100 text-red-700 px-2 py-0.5 rounded">
                            missing schema reference
                          </span>
                        )}
                      </div>

                      {row.description && (
                        <p className="text-sm text-slate-600 mt-1">{row.description}</p>
                      )}

                      {row.readOnlyReason && (
                        <p className="text-xs text-amber-700 mt-1">{row.readOnlyReason}</p>
                      )}

                      {row.source === 'ref' && row.schemaRefName && (
                        <button
                          type="button"
                          onClick={() => handleOpenSchemaReference(row)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault()
                              handleOpenSchemaReference(row)
                            }
                          }}
                          className="mt-2 text-sm text-blue-700 underline underline-offset-2 hover:text-blue-900"
                        >
                          Open schema: {row.schemaRefName}
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => openEdit(row)}
                        className="px-2.5 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ statusCode: row.statusCode, mediaType: row.mediaType })}
                        className="px-2.5 py-1.5 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 rounded border border-slate-200 bg-slate-50 p-3">
                      <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-2">Structure preview</div>
                      {renderExpandedStructure(row)}
                    </div>
                  )}
                </div>
                )})}
              </div>
            </div>
          ))}
        </div>
      )}

      <EditorModal
        state={editor}
        schemaNames={schemaNames}
        readOnlyReason={
          rows.find((row) => row.id === editor.rowId)?.readOnlyReason ??
          'This model shape is unsupported by the visual editor and will be preserved as-is.'
        }
        onClose={closeEditor}
        onSave={handleSave}
        onChange={setEditor}
      />

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="bg-red-600 text-white px-6 py-4 rounded-t-xl">
              <h3 className="text-xl font-bold">Delete response</h3>
            </div>
            <div className="p-6">
              <p className="text-slate-700">
                Delete response media type
                {' '}
                <span className="font-mono font-semibold">{deleteTarget.mediaType ?? '(no media type)'}</span>
                {' '}
                under status
                {' '}
                <span className="font-mono font-semibold">{deleteTarget.statusCode}</span>
                ?
              </p>
              <p className="text-xs text-slate-500 mt-2">
                If this is the last media type for the status code, the whole status response node will be removed.
              </p>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 rounded-b-xl">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-slate-700 hover:bg-slate-200 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

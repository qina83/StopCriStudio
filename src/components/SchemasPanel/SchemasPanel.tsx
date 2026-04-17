/**
 * SchemasPanel Component
 * Implements WP-034, WP-035, WP-036, WP-038
 */

import React, { useMemo, useState } from 'react'
import { OpenAPISpecification, RequestBody, BodyParameter } from '../../types'
import { RequestBodyPanel } from '../RequestBody/RequestBodyPanel'
import {
  buildObjectSchemaFromProperties,
  isValidSchemaName,
  parseEditableObjectSchema,
  renameSchemaRefsInRequestBodies,
} from '../../utils/schemaUtils'

interface SchemasPanelProps {
  specification: OpenAPISpecification
  onUpdateSpecification?: (updater: (spec: OpenAPISpecification) => OpenAPISpecification) => void
}

type EditorMode = 'create' | 'edit'

interface SchemaEditorState {
  open: boolean
  mode: EditorMode
  originalName: string
  name: string
  body: RequestBody
  error: string | null
}

interface ParsedSchemaView {
  name: string
  raw: unknown
  editable: boolean
  properties: BodyParameter[]
  reason?: string
}

function renderTreePreview(params: BodyParameter[], depth = 0): React.ReactNode {
  return params.map((param, idx) => {
    const key = `${depth}-${idx}-${param.name}`
    const indent = depth * 16

    let label: string = param.type
    if (param.type === 'array') {
      label = `array<${param.itemType}>`
    }

    return (
      <div key={key} style={{ marginLeft: `${indent}px` }} className="mt-1">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-mono text-slate-900">{param.name}</span>
          <span className="text-xs font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">{label}</span>
          {param.required && <span className="text-[11px] text-red-600 font-semibold">required</span>}
        </div>

        {param.type === 'object' && (param as any).ref && (
          <div className="text-xs text-blue-700 font-mono ml-2 mt-0.5">{(param as any).ref}</div>
        )}

        {param.type === 'object' && !(param as any).ref && renderTreePreview(param.properties, depth + 1)}
        {param.type === 'array' && param.itemType === 'object' && renderTreePreview(param.itemProperties ?? [], depth + 1)}
      </div>
    )
  })
}

function SchemaEditorModal({
  state,
  existingNames,
  schemas,
  onClose,
  onChange,
  onSave,
}: {
  state: SchemaEditorState
  existingNames: string[]
  schemas: Record<string, unknown>
  onClose: () => void
  onChange: (next: SchemaEditorState) => void
  onSave: () => void
}) {
  if (!state.open) return null

  const duplicate = existingNames.some(
    (n) => n === state.name.trim() && (state.mode === 'create' || n !== state.originalName),
  )

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-blue-600 text-white px-6 py-4 rounded-t-xl">
          <h3 className="text-xl font-bold">
            {state.mode === 'create' ? 'Add Schema' : `Edit Schema: ${state.originalName}`}
          </h3>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Schema name <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={state.name}
              onChange={(e) => onChange({ ...state, name: e.target.value, error: null })}
              placeholder="UserResponse"
              autoFocus
            />
            <p className="text-xs text-slate-500 mt-1">Allowed characters: letters, numbers, hyphens, underscores.</p>
            {duplicate && (
              <p className="mt-1 text-xs text-red-600 font-medium">A schema with this name already exists.</p>
            )}
            {state.error && <p className="mt-1 text-xs text-red-600 font-medium">{state.error}</p>}
          </div>

          <div className="border border-slate-200 rounded-lg p-3">
            <p className="text-sm font-semibold text-slate-700 mb-2">Schema Fields (top-level is always object)</p>
            <RequestBodyPanel
              pathName="components/schemas"
              method="SCHEMA"
              mode="schema"
              body={state.body}
              onChange={(body) => onChange({ ...state, body })}
              schemas={schemas}
            />
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 rounded-b-xl">
          <button onClick={onClose} className="px-4 py-2 text-slate-700 hover:bg-slate-200 rounded-lg font-medium transition-colors">
            Cancel
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium transition-colors"
          >
            Save Schema
          </button>
        </div>
      </div>
    </div>
  )
}

export function SchemasPanel({ specification, onUpdateSpecification }: SchemasPanelProps) {
  const components = (specification.content.components as Record<string, unknown>) || {}
  const schemas = (components.schemas as Record<string, unknown>) || {}

  const schemaViews = useMemo<ParsedSchemaView[]>(() => {
    return Object.keys(schemas)
      .sort((a, b) => a.localeCompare(b))
      .map((name) => {
        const raw = schemas[name]
        const parsed = parseEditableObjectSchema(raw)
        return {
          name,
          raw,
          editable: parsed.editable,
          properties: parsed.properties,
          reason: parsed.reason,
        }
      })
  }, [schemas])

  const [editor, setEditor] = useState<SchemaEditorState>({
    open: false,
    mode: 'create',
    originalName: '',
    name: '',
    body: { required: false, mediaType: 'application/json', properties: [] },
    error: null,
  })

  const [deleteName, setDeleteName] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const [expandedSchemas, setExpandedSchemas] = useState<Set<string>>(new Set())

  const openCreate = () => {
    setEditor({
      open: true,
      mode: 'create',
      originalName: '',
      name: '',
      body: { required: false, mediaType: 'application/json', properties: [] },
      error: null,
    })
  }

  const openEdit = (schemaName: string) => {
    const schemaView = schemaViews.find((s) => s.name === schemaName)
    if (!schemaView || !schemaView.editable) return

    setEditor({
      open: true,
      mode: 'edit',
      originalName: schemaName,
      name: schemaName,
      body: {
        required: false,
        mediaType: 'application/json',
        properties: schemaView.properties,
      },
      error: null,
    })
  }

  const closeEditor = () => {
    setEditor((prev) => ({ ...prev, open: false, error: null }))
  }

  const saveSchema = () => {
    if (!onUpdateSpecification) return

    const trimmedName = editor.name.trim()
    if (!trimmedName) {
      setEditor((prev) => ({ ...prev, error: 'Schema name is required.' }))
      return
    }

    if (!isValidSchemaName(trimmedName)) {
      setEditor((prev) => ({ ...prev, error: 'Schema name must contain only letters, numbers, hyphens, and underscores.' }))
      return
    }

    const duplicate = Object.keys(schemas).some(
      (n) => n === trimmedName && (editor.mode === 'create' || n !== editor.originalName),
    )

    if (duplicate) {
      setEditor((prev) => ({ ...prev, error: 'A schema with this name already exists.' }))
      return
    }

    const nextSchema = buildObjectSchemaFromProperties(editor.body.properties)
    let updatedRefCount = 0

    onUpdateSpecification((spec) => {
      const renameResult =
        editor.mode === 'edit' && editor.originalName !== trimmedName
          ? renameSchemaRefsInRequestBodies(spec, editor.originalName, trimmedName)
          : { content: JSON.parse(JSON.stringify(spec.content)), updatedCount: 0 }

      updatedRefCount = renameResult.updatedCount

      const updatedContent = renameResult.content as Record<string, any>
      const updatedComponents = (updatedContent.components as Record<string, any>) || {}
      const updatedSchemas = { ...(updatedComponents.schemas as Record<string, unknown>) || {} }

      if (editor.mode === 'edit' && editor.originalName !== trimmedName) {
        delete updatedSchemas[editor.originalName]
      }

      updatedSchemas[trimmedName] = nextSchema

      return {
        ...spec,
        content: {
          ...updatedContent,
          components: {
            ...updatedComponents,
            schemas: updatedSchemas,
          },
        },
        updatedAt: Date.now(),
      }
    })

    setInfoMessage(
      editor.mode === 'edit' && editor.originalName !== trimmedName
        ? `Schema renamed. Updated ${updatedRefCount} request body $ref occurrence(s).`
        : 'Schema saved successfully.',
    )

    closeEditor()
  }

  const confirmDelete = () => {
    if (!deleteName || !onUpdateSpecification) return

    onUpdateSpecification((spec) => {
      const content = JSON.parse(JSON.stringify(spec.content)) as Record<string, any>
      const componentsObj = (content.components as Record<string, any>) || {}
      const currentSchemas = { ...(componentsObj.schemas as Record<string, unknown>) || {} }
      delete currentSchemas[deleteName]

      const nextComponents = { ...componentsObj }
      if (Object.keys(currentSchemas).length === 0) {
        delete nextComponents.schemas
      } else {
        nextComponents.schemas = currentSchemas
      }

      return {
        ...spec,
        content: {
          ...content,
          components: nextComponents,
        },
        updatedAt: Date.now(),
      }
    })

    setInfoMessage(`Schema "${deleteName}" deleted.`)
    setDeleteName(null)
  }

  return (
    <div className="p-8 bg-white flex-1 overflow-y-auto">
      <div className="max-w-4xl">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-3xl font-bold text-slate-900">Schemas</h2>
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            + Add Schema
          </button>
        </div>
        <p className="text-slate-500 mb-6">Define reusable object models in components/schemas.</p>

        {infoMessage && (
          <div className="mb-4 p-3 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 text-sm">
            {infoMessage}
          </div>
        )}

        {schemaViews.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-slate-300 rounded-lg bg-slate-50">
            <div className="text-4xl mb-3">📦</div>
            <p className="text-slate-600 font-medium mb-2">No schemas defined yet</p>
            <p className="text-slate-500 text-sm">Click Add Schema to create your first reusable data model.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {schemaViews.map((schema) => {
              const expanded = expandedSchemas.has(schema.name)
              return (
                <div key={schema.name} className="p-4 border border-slate-200 rounded-lg">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-mono text-lg font-semibold text-slate-900">{schema.name}</div>
                      {schema.editable ? (
                        <p className="text-sm text-slate-500 mt-1">Editable object schema</p>
                      ) : (
                        <p className="text-sm text-amber-700 mt-1 font-medium">
                          Read-only raw schema. Visual editing unavailable: {schema.reason}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {schema.editable && (
                        <button
                          onClick={() => setExpandedSchemas((prev) => {
                            const next = new Set(prev)
                            if (next.has(schema.name)) next.delete(schema.name)
                            else next.add(schema.name)
                            return next
                          })}
                          className="px-3 py-1.5 text-sm bg-slate-100 text-slate-700 rounded hover:bg-slate-200"
                        >
                          {expanded ? 'Hide fields' : 'Show fields'}
                        </button>
                      )}

                      {schema.editable && (
                        <button
                          onClick={() => openEdit(schema.name)}
                          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Edit
                        </button>
                      )}

                      <button
                        onClick={() => setDeleteName(schema.name)}
                        className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {schema.editable && expanded && (
                    <div className="mt-3 border-t border-slate-200 pt-3">
                      {schema.properties.length > 0 ? (
                        <div>{renderTreePreview(schema.properties)}</div>
                      ) : (
                        <p className="text-sm text-slate-400 italic">No properties defined yet.</p>
                      )}
                    </div>
                  )}

                  {!schema.editable && (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-sm text-slate-700">Show raw schema JSON</summary>
                      <pre className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded text-xs overflow-auto">
                        {JSON.stringify(schema.raw, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <SchemaEditorModal
          state={editor}
          existingNames={Object.keys(schemas)}
          schemas={schemas}
          onClose={closeEditor}
          onChange={setEditor}
          onSave={saveSchema}
        />

        {deleteName && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDeleteName(null)}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
              <div className="bg-red-600 text-white px-6 py-4 rounded-t-xl">
                <h3 className="text-xl font-bold">Delete Schema</h3>
              </div>
              <div className="p-6">
                <p className="text-slate-700">
                  Delete schema <span className="font-mono font-semibold">{deleteName}</span>? This cannot be undone.
                </p>
              </div>
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 rounded-b-xl">
                <button
                  onClick={() => setDeleteName(null)}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-200 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg font-medium transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
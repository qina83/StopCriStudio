/**
 * SchemasPanel Component
 * Manages reusable schemas/models in the specification
 */

import React from 'react'
import { OpenAPISpecification } from '../../types'

interface SchemasPanelProps {
  specification: OpenAPISpecification
  onAddSchema?: () => void
}

export function SchemasPanel({ specification, onAddSchema }: SchemasPanelProps) {
  const components = (specification.content.components as Record<string, unknown>) || {}
  const schemas = (components.schemas as Record<string, unknown>) || {}
  const schemaCount = Object.keys(schemas).length

  return (
    <div className="p-8 bg-white flex-1 overflow-y-auto">
      <div className="max-w-2xl">
        {/* Title */}
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-3xl font-bold text-slate-900">Schemas</h2>
          {onAddSchema && (
            <button
              onClick={onAddSchema}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              + Add Schema
            </button>
          )}
        </div>
        <p className="text-slate-500 mb-8">
          Define reusable data models and schemas for your API
        </p>

        {/* Schemas list */}
        {schemaCount === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-slate-300 rounded-lg bg-slate-50">
            <div className="text-4xl mb-3">📦</div>
            <p className="text-slate-600 font-medium mb-2">No schemas defined yet</p>
            <p className="text-slate-500 text-sm">
              Click the "Add Schema" button to create your first reusable data model
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.keys(schemas).map((schemaName) => (
              <div
                key={schemaName}
                className="p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
              >
                <div className="font-mono text-lg font-semibold text-slate-900">{schemaName}</div>
                <p className="text-sm text-slate-500 mt-1">Schema definition</p>
              </div>
            ))}
          </div>
        )}

        {/* Information box */}
        <div className="mt-8 p-4 bg-slate-50 border border-slate-200 rounded-lg">
          <h3 className="font-semibold text-slate-900 mb-2">About Schemas</h3>
          <p className="text-sm text-slate-600">
            Schemas define the structure of request and response objects in your API. By defining
            reusable schemas in this section, you can reference them across multiple operations,
            keeping your specification DRY and maintainable.
          </p>
        </div>
      </div>
    </div>
  )
}

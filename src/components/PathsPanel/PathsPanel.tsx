/**
 * PathsPanel Component
 * Manages API paths in the specification
 */

import React from 'react'
import { OpenAPISpecification } from '../../types'

interface PathsPanelProps {
  specification: OpenAPISpecification
  onAddPath?: () => void
}

export function PathsPanel({ specification, onAddPath }: PathsPanelProps) {
  const paths = (specification.content.paths as Record<string, unknown>) || {}
  const pathCount = Object.keys(paths).length

  return (
    <div className="p-8 bg-white flex-1 overflow-y-auto">
      <div className="max-w-2xl">
        {/* Title */}
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-3xl font-bold text-slate-900">API Paths</h2>
          {onAddPath && (
            <button
              onClick={onAddPath}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              + Add Path
            </button>
          )}
        </div>
        <p className="text-slate-500 mb-8">
          Define the endpoints and operations available in your API
        </p>

        {/* Paths list */}
        {pathCount === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-slate-300 rounded-lg bg-slate-50">
            <div className="text-4xl mb-3">📍</div>
            <p className="text-slate-600 font-medium mb-2">No paths defined yet</p>
            <p className="text-slate-500 text-sm">
              Click the "Add Path" button to define your first API endpoint
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.keys(paths).map((pathName) => (
              <div key={pathName} className="p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
                <div className="font-mono text-lg font-semibold text-slate-900">{pathName}</div>
                <p className="text-sm text-slate-500 mt-1">Path configuration</p>
              </div>
            ))}
          </div>
        )}

        {/* Information box */}
        <div className="mt-8 p-4 bg-slate-50 border border-slate-200 rounded-lg">
          <h3 className="font-semibold text-slate-900 mb-2">About Paths</h3>
          <p className="text-sm text-slate-600">
            Paths represent the resources and endpoints available in your API. Each path can support
            different HTTP methods (GET, POST, PUT, DELETE, etc.) with their own operation details.
          </p>
        </div>
      </div>
    </div>
  )
}

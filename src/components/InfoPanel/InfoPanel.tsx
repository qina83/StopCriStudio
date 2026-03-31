/**
 * InfoPanel Component
 * Displays and edits specification metadata (name, version, OpenAPI version)
 */

import React, { useState, useCallback } from 'react'
import { OpenAPISpecification } from '../../types'

interface InfoPanelProps {
  specification: OpenAPISpecification
  onUpdate: (name?: string, specVersion?: string) => void
  isSaving: boolean
}

export function InfoPanel({ specification, onUpdate, isSaving }: InfoPanelProps) {
  const [localName, setLocalName] = useState(specification.name)
  const [localSpecVersion, setLocalSpecVersion] = useState(specification.specVersion)

  // Handle name change with debounce
  const handleNameChange = useCallback(
    (value: string) => {
      setLocalName(value)
      onUpdate(value, undefined)
    },
    [onUpdate]
  )

  // Handle version change with debounce
  const handleVersionChange = useCallback(
    (value: string) => {
      setLocalSpecVersion(value)
      onUpdate(undefined, value)
    },
    [onUpdate]
  )

  // Get OpenAPI version from specification (fixed at 3.0.0)
  const openapIVersion = specification.openAPIVersion

  return (
    <div className="p-8 bg-white flex-1 overflow-y-auto">
      <div className="max-w-2xl">
        {/* Title */}
        <h2 className="text-3xl font-bold text-slate-900 mb-1">API Information</h2>
        <p className="text-slate-500 mb-8">
          Configure the basic information about your OpenAPI specification
        </p>

        {/* Save status */}
        {isSaving && (
          <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">💾 Saving...</p>
          </div>
        )}

        {/* Form fields */}
        <form className="space-y-6">
          {/* Specification Name */}
          <div>
            <label htmlFor="spec-name" className="block text-sm font-semibold text-slate-900 mb-2">
              Specification Name
            </label>
            <input
              id="spec-name"
              type="text"
              value={localName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Enter specification name"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900 placeholder-slate-500"
            />
            <p className="text-xs text-slate-500 mt-1">
              This will be displayed in the header and used as the API title
            </p>
          </div>

          {/* Specification Version */}
          <div>
            <label htmlFor="spec-version" className="block text-sm font-semibold text-slate-900 mb-2">
              Specification Version
            </label>
            <input
              id="spec-version"
              type="text"
              value={localSpecVersion}
              onChange={(e) => handleVersionChange(e.target.value)}
              placeholder="1.0.0"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900 placeholder-slate-500"
            />
            <p className="text-xs text-slate-500 mt-1">
              Version number for your API specification
            </p>
          </div>

          {/* OpenAPI Version (Read-only) */}
          <div>
            <label htmlFor="openapi-version" className="block text-sm font-semibold text-slate-900 mb-2">
              OpenAPI Version
            </label>
            <div
              id="openapi-version"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-900 font-mono"
            >
              {openapIVersion}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Fixed at {openapIVersion} for this editor
            </p>
          </div>
        </form>

        {/* Information box */}
        <div className="mt-8 p-4 bg-slate-50 border border-slate-200 rounded-lg">
          <h3 className="font-semibold text-slate-900 mb-2">About OpenAPI 3.0</h3>
          <p className="text-sm text-slate-600">
            OpenAPI 3.0 is a widely-used specification format for describing REST APIs. Your
            specification will be stored locally in your browser and automatically saved as you make
            changes.
          </p>
        </div>
      </div>
    </div>
  )
}

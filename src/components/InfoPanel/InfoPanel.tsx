/**
 * InfoPanel Component
 * Displays and edits specification metadata (name, version, OpenAPI version)
 */

import React, { useState, useCallback } from 'react'
import { OpenAPISpecification } from '../../types'
import { Badge, FieldShell, PanelShell, TextInput } from '../ui'

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
    <PanelShell
      title="API Information"
      description="Configure the specification identity and versioning details used throughout the editor."
      actions={isSaving ? <Badge variant="status" tone="info">Saving</Badge> : <Badge variant="status" tone="success">Autosave Ready</Badge>}
      className="flex-1"
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <form className="ui-panel space-y-6 p-6">
          <FieldShell
            label="Specification Name"
            htmlFor="spec-name"
            helpText="This title appears in the editor header and becomes the API title in the exported document."
          >
            <TextInput
              id="spec-name"
              type="text"
              value={localName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Enter specification name"
            />
          </FieldShell>

          <FieldShell
            label="Specification Version"
            htmlFor="spec-version"
            helpText="Use your product or API version here, for example 1.0.0."
          >
            <TextInput
              id="spec-version"
              type="text"
              value={localSpecVersion}
              onChange={(e) => handleVersionChange(e.target.value)}
              placeholder="1.0.0"
            />
          </FieldShell>

          <FieldShell
            label="OpenAPI Version"
            htmlFor="openapi-version"
            helpText={`Fixed at ${openapIVersion} for this editor.`}
          >
            <div id="openapi-version" className="ui-input bg-surface-subtle font-mono text-text-secondary" aria-readonly="true">
              {openapIVersion}
            </div>
          </FieldShell>
        </form>

        <aside className="space-y-5">
          <div className="ui-panel p-6">
            <h3 className="text-lg font-semibold text-text-primary">Save status</h3>
            <p className="mt-2 text-sm leading-6 text-text-secondary">
              Changes in this panel are saved automatically as you type. The editor header reflects the global save state.
            </p>
            <div className="mt-4">
              <Badge variant="status" tone={isSaving ? 'info' : 'success'}>
                {isSaving ? 'Saving now' : 'Saved locally'}
              </Badge>
            </div>
          </div>

          <div className="ui-panel-subtle p-6">
            <h3 className="text-lg font-semibold text-text-primary">About OpenAPI 3.0</h3>
            <p className="mt-2 text-sm leading-6 text-text-secondary">
              OpenAPI 3.0 is a broadly adopted REST API description format. This editor keeps your work offline-first while preserving structured paths, request models, responses, and reusable schemas.
            </p>
          </div>
        </aside>
      </div>
    </PanelShell>
  )
}

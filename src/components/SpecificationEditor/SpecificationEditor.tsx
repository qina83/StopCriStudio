/**
 * SpecificationEditor Component
 * Main editor with 3-panel layout: sidebar, header, and content area
 */

import React, { useState } from 'react'
import { OpenAPISpecification } from '../../types'
import { useSpecification } from '../../hooks/useSpecification'
import { exportSpecificationAsYAML } from '../../utils/exportService'
import { Sidebar } from '../Sidebar/Sidebar'
import { InfoPanel } from '../InfoPanel/InfoPanel'
import { PathsPanel } from '../PathsPanel/PathsPanel'
import { SchemasPanel } from '../SchemasPanel/SchemasPanel'
import { AppButton, AppIconButton, BackIcon, Badge, ExportIcon, InfoIcon } from '../ui'

type NavigationItem = 'info' | 'paths' | 'schemas'
type PathViewMode = 'form' | 'list'

interface SpecificationEditorProps {
  specification: OpenAPISpecification
  onBack?: () => void
}

export function SpecificationEditor({ specification, onBack }: SpecificationEditorProps) {
  const [activeItem, setActiveItem] = useState<NavigationItem>('info')
  const [pathViewMode, setPathViewMode] = useState<PathViewMode>('list') // WP-002.1
  const [selectedPath, setSelectedPath] = useState<string | null>(null) // Track selected path from sidebar
  const [selectedSchema, setSelectedSchema] = useState<string | null>(null)
  const [quickEditSchemaName, setQuickEditSchemaName] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const { specification: spec, updateInfo, updateSpecification, updateSpecificationAndSave, isSaving } = useSpecification(specification)

  // Handle export specification as YAML (WP-004)
  const handleExport = async () => {
    setIsExporting(true)
    try {
      exportSpecificationAsYAML(spec)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to export specification')
    } finally {
      setIsExporting(false)
    }
  }

  // Handle navigation to paths - reset view mode to list when navigating to paths (WP-002.1)
  const handleNavigate = (item: NavigationItem) => {
    setActiveItem(item)
    // When clicking on Paths, reset to list view (WP-002.1)
    if (item === 'paths') {
      setPathViewMode('list')
    } else {
      // Reset selected path when navigating away from paths
      setSelectedPath(null)
    }
  }

  // Handle path selection from sidebar
  const handlePathSelect = (pathName: string) => {
    setSelectedPath(pathName)
    setActiveItem('paths') // Navigate to paths panel
  }

  const handleSchemaSelect = (schemaName: string) => {
    setSelectedSchema(schemaName)
    setActiveItem('schemas')
  }

  const handleSchemaQuickEdit = (schemaName: string) => {
    setQuickEditSchemaName(schemaName)
  }

  // Handle switching path view mode (WP-002.1)
  const handlePathViewModeChange = (mode: PathViewMode) => {
    setPathViewMode(mode)
  }

  const renderContent = () => {
    switch (activeItem) {
      case 'info':
        return <InfoPanel specification={spec} onUpdate={updateInfo} isSaving={isSaving} />
      case 'paths':
        return (
          <PathsPanel
            specification={spec}
            onUpdateSpecification={updateSpecification}
            onUpdateSpecificationAndSave={updateSpecificationAndSave}
            viewMode={pathViewMode}
            onViewModeChange={handlePathViewModeChange}
            selectedPath={selectedPath}
            onSelectedPathChange={setSelectedPath}
            onOpenSchemaRef={handleSchemaQuickEdit}
          />
        )
      case 'schemas':
        return (
          <SchemasPanel
            specification={spec}
            onUpdateSpecification={updateSpecificationAndSave || updateSpecification}
            selectedSchemaName={selectedSchema}
            onSelectedSchemaChange={setSelectedSchema}
          />
        )
      default:
        return <InfoPanel specification={spec} onUpdate={updateInfo} isSaving={isSaving} />
    }
  }

  return (
    <div className="min-h-screen bg-app-bg flex flex-col">
      <header className="border-b border-border-default bg-surface-base/95 backdrop-blur-sm shadow-panel">
        <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            {onBack ? (
              <AppIconButton label="Back to welcome" onClick={onBack}>
                <BackIcon className="h-4 w-4" />
              </AppIconButton>
            ) : null}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="truncate text-2xl font-bold text-text-primary">{spec.name}</h1>
                <Badge variant="count">v{spec.specVersion}</Badge>
                <Badge variant="status" tone={isSaving ? 'info' : 'success'}>
                  {isSaving ? 'Saving' : 'Saved locally'}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-text-secondary">
                Editing {activeItem === 'info' ? 'API information' : activeItem === 'paths' ? 'paths and operations' : 'schemas'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <AppButton
              variant={activeItem === 'info' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setActiveItem('info')}
              leadingIcon={<InfoIcon className="h-4 w-4" />}
            >
              API Info
            </AppButton>
            <AppButton
              onClick={handleExport}
              disabled={isExporting || isSaving}
              variant="primary"
              leadingIcon={<ExportIcon className="h-4 w-4" />}
            >
              {isExporting ? 'Exporting…' : 'Export YAML'}
            </AppButton>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeItem={activeItem}
          onNavigate={handleNavigate}
          specification={spec}
          selectedPath={selectedPath}
          onPathSelect={handlePathSelect}
          selectedSchema={selectedSchema}
          onSchemaSelect={handleSchemaSelect}
        />

        {renderContent()}

        <SchemasPanel
          mode="modal-only"
          specification={spec}
          onUpdateSpecification={updateSpecificationAndSave || updateSpecification}
          selectedSchemaName={quickEditSchemaName}
          onSelectedSchemaChange={setQuickEditSchemaName}
        />
      </div>
    </div>
  )
}

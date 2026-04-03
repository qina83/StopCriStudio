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
  const [isExporting, setIsExporting] = useState(false)
  const { specification: spec, updateInfo, updateSpecification, isSaving } = useSpecification(specification)

  const handleAddSchema = () => {
    // TODO: Implement add schema dialog
    console.log('Add schema')
  }

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
            viewMode={pathViewMode}
            onViewModeChange={handlePathViewModeChange}
            selectedPath={selectedPath}
            onSelectedPathChange={setSelectedPath}
          />
        )
      case 'schemas':
        return <SchemasPanel specification={spec} onAddSchema={handleAddSchema} />
      default:
        return <InfoPanel specification={spec} onUpdate={updateInfo} isSaving={isSaving} />
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                title="Back to welcome"
                aria-label="Go back"
              >
                ←
              </button>
            )}
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{spec.name}</h1>
                <p className="text-sm text-slate-500">v{spec.specVersion}</p>
              </div>
              {/* Edit API Information icon - WP-010 */}
              <button
                onClick={() => setActiveItem('info')}
                className={`p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  activeItem === 'info'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title="Edit API Information"
                aria-label="Edit API Information"
              >
                ✏️
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Export Button - WP-004 */}
            <button
              onClick={handleExport}
              disabled={isExporting || isSaving}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-4 focus:ring-emerald-300"
              title="Export specification as YAML"
              aria-label="Export specification as YAML file"
            >
              {isExporting ? '⬇ Exporting...' : '⬇ Export'}
            </button>

            {isSaving && (
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-lg">
                <span className="inline-block w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
                <span className="text-xs font-medium text-blue-700">Saving...</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main content area with sidebar and panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeItem={activeItem}
          onNavigate={handleNavigate}
          specification={spec}
          selectedPath={selectedPath}
          onPathSelect={handlePathSelect}
        />

        {/* Content panel */}
        {renderContent()}
      </div>
    </div>
  )
}

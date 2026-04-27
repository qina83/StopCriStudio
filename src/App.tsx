import React, { useState, useRef } from 'react'
import { OpenAPISpecification } from './types'
import { SpecificationEditor } from './components/SpecificationEditor/SpecificationEditor'
import { LoadSpecificationModal } from './components/LoadSpecificationModal'
import {
  AppButton,
  FolderIcon,
  ImportIcon,
  ModalShell,
  SparkleIcon,
  WarningIcon,
} from './components/ui'
import {
  createNewSpecification,
  saveSpecification,
  getAllSpecifications,
} from './services/storageService'
import { loadOpenAPIFile } from './utils/openAPILoader'

/**
 * App Component
 * Main application entry point implementing WP-001, WP-002, WP-007, and WP-008
 */
function App() {
  const [currentView, setCurrentView] = useState<'welcome' | 'editor'>('welcome')
  const [currentSpecification, setCurrentSpecification] = useState<OpenAPISpecification | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loadErrorDetails, setLoadErrorDetails] = useState<string[]>([])
  const [showLoadModal, setShowLoadModal] = useState(false)
  const [savedSpecifications, setSavedSpecifications] = useState(getAllSpecifications())
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleCreateNew = () => {
    // Create a new specification
    const newSpec = createNewSpecification('Untitled API')
    setCurrentSpecification(newSpec)
    setCurrentView('editor')
  }

  const handleLoadFile = () => {
    fileInputRef.current?.click()
  }

  const handleLoadSavedSpecification = () => {
    setSavedSpecifications(getAllSpecifications())
    setShowLoadModal(true)
  }

  const handleLoadSpecification = (specification: OpenAPISpecification) => {
    setCurrentSpecification(specification)
    setCurrentView('editor')
    setShowLoadModal(false)
  }

  const handleDeleteSpecification = () => {
    // Update the saved specifications list after deletion
    setSavedSpecifications(getAllSpecifications())
  }

  const handleLoadModalClose = () => {
    setShowLoadModal(false)
  }

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const validExtensions = ['.yaml', '.yml', '.json']
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()

    if (!validExtensions.includes(fileExtension)) {
      setLoadError('Invalid file type')
      setLoadErrorDetails([
        `File "${file.name}" is not a valid OpenAPI specification file.`,
        'Please select a YAML (.yaml, .yml) or JSON (.json) file.',
      ])
      return
    }

    try {
      const fileContent = await file.text()
      const result = loadOpenAPIFile(fileContent, file.name)

      if (result.success && result.spec) {
        // Save the specification to local storage
        saveSpecification(result.spec)
        // Navigate to the editor
        setCurrentSpecification(result.spec)
        setCurrentView('editor')
        // Clear any previous errors
        setLoadError(null)
        setLoadErrorDetails([])
      } else {
        // Show validation errors
        setLoadError('Invalid OpenAPI Specification')
        setLoadErrorDetails(
          result.errors?.map((error) => `${error.field}: ${error.message}`) || [
            'The file is not a valid OpenAPI specification.',
          ]
        )
      }
    } catch (error) {
      setLoadError('Error reading file')
      setLoadErrorDetails([error instanceof Error ? error.message : 'Unknown error occurred.'])
    }

    // Reset the file input
    event.target.value = ''
  }

  const handleBackToWelcome = () => {
    setSavedSpecifications(getAllSpecifications())
    setCurrentView('welcome')
    setCurrentSpecification(null)
  }

  if (currentView === 'editor' && currentSpecification) {
    return <SpecificationEditor specification={currentSpecification} onBack={handleBackToWelcome} />
  }

  return (
    <div className="min-h-screen bg-app-bg text-text-primary">
      <input
        ref={fileInputRef}
        type="file"
        accept=".yaml,.yml,.json"
        onChange={handleFileSelected}
        className="hidden"
        aria-hidden="true"
      />

      <ModalShell
        open={!!loadError}
        title={loadError ?? 'Import Error'}
        tone="danger"
        size="sm"
        onClose={() => {
          setLoadError(null)
          setLoadErrorDetails([])
        }}
        footer={(
          <>
            <AppButton
              variant="ghost"
              onClick={() => {
                setLoadError(null)
                setLoadErrorDetails([])
              }}
            >
              Close
            </AppButton>
            <AppButton
              variant="danger"
              onClick={() => {
                setLoadError(null)
                setLoadErrorDetails([])
                handleLoadFile()
              }}
            >
              Try Another File
            </AppButton>
          </>
        )}
      >
        <div className="space-y-4">
          <div className="ui-status-banner border-red-200 bg-red-50 text-red-700">
            <WarningIcon className="h-4 w-4" />
            <span>The selected file could not be loaded into the editor.</span>
          </div>
          <div className="space-y-2">
            {loadErrorDetails.map((detail, index) => (
              <p key={index} className="text-sm text-text-secondary">
                {detail}
              </p>
            ))}
          </div>
        </div>
      </ModalShell>

      <LoadSpecificationModal
        isOpen={showLoadModal}
        specifications={savedSpecifications}
        onLoad={handleLoadSpecification}
        onClose={handleLoadModalClose}
        onDelete={handleDeleteSpecification}
      />

      <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-10 sm:px-6 lg:px-8">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-28 left-1/2 h-72 w-72 -translate-x-[120%] rounded-full bg-sky-200/50 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-80 w-80 translate-x-1/4 rounded-full bg-emerald-100/50 blur-3xl" />
        </div>

        <div className="relative mx-auto w-full max-w-6xl">
          <section className="ui-panel-raised overflow-hidden">
            <div className="border-b border-border-default bg-gradient-to-br from-surface-raised via-surface-base to-sky-50 px-6 py-8 sm:px-8 sm:py-10">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">Offline OpenAPI Workspace</p>
              <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-text-primary sm:text-5xl">Stop Cri Studio</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-text-secondary sm:text-lg">
                Create, load, edit, and export OpenAPI specifications with one consistent offline workflow. Everything stays local, autosaves continuously, and uses the same editing system across info, paths, and schemas.
              </p>
            </div>

            <div className="grid gap-5 p-6 sm:grid-cols-3 sm:p-8">
              <button
                onClick={handleCreateNew}
                className="ui-card-interactive group flex min-h-[220px] flex-col items-start justify-between p-6 text-left transition-all"
                aria-label="Create a new OpenAPI specification"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-sky-50 text-action-primary shadow-panel">
                  <SparkleIcon className="h-7 w-7 transition-transform duration-200 group-hover:scale-110" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-text-primary">Create</h2>
                  <p className="mt-2 text-sm leading-6 text-text-secondary">Start a new specification from a clean, autosaved workspace.</p>
                </div>
              </button>

              <button
                onClick={handleLoadSavedSpecification}
                className="ui-card-interactive group flex min-h-[220px] flex-col items-start justify-between p-6 text-left transition-all"
                aria-label="Load a previously saved specification"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 shadow-panel">
                  <FolderIcon className="h-7 w-7 transition-transform duration-200 group-hover:scale-110" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-text-primary">Load</h2>
                  <p className="mt-2 text-sm leading-6 text-text-secondary">Resume work from saved local specifications without leaving the browser.</p>
                </div>
              </button>

              <button
                onClick={handleLoadFile}
                className="ui-card-interactive group flex min-h-[220px] flex-col items-start justify-between p-6 text-left transition-all"
                aria-label="Load an existing OpenAPI specification file"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-amber-50 text-amber-700 shadow-panel">
                  <ImportIcon className="h-7 w-7 transition-transform duration-200 group-hover:scale-110" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-text-primary">Import File</h2>
                  <p className="mt-2 text-sm leading-6 text-text-secondary">Bring in YAML or JSON OpenAPI files and continue editing immediately.</p>
                </div>
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

export default App

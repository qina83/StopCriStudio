import React, { useState, useRef } from 'react'
import { OpenAPISpecification } from './types'
import { SpecificationEditor } from './components/SpecificationEditor/SpecificationEditor'
import { LoadSpecificationModal } from './components/LoadSpecificationModal'
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
    setShowLoadModal(true)
  }

  const handleLoadSpecification = (specification: OpenAPISpecification) => {
    setCurrentSpecification(specification)
    setCurrentView('editor')
    setShowLoadModal(false)
  }

  const handleDeleteSpecification = (_id: string) => {
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
    setCurrentView('welcome')
    setCurrentSpecification(null)
  }

  if (currentView === 'editor' && currentSpecification) {
    return <SpecificationEditor specification={currentSpecification} onBack={handleBackToWelcome} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hidden file input for file selection */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".yaml,.yml,.json"
        onChange={handleFileSelected}
        className="hidden"
        aria-hidden="true"
      />

      {/* Error Modal - WP-007 */}
      {loadError && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-red-600 mb-4">⚠️ {loadError}</h2>
            <div className="space-y-2 mb-6">
              {loadErrorDetails.map((detail, index) => (
                <p key={index} className="text-slate-600 text-sm">
                  {detail}
                </p>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setLoadError(null)
                  setLoadErrorDetails([])
                  handleLoadFile()
                }}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors font-medium"
              >
                Try Another File
              </button>
              <button
                onClick={() => {
                  setLoadError(null)
                  setLoadErrorDetails([])
                }}
                className="flex-1 px-4 py-2 bg-slate-200 text-slate-800 rounded hover:bg-slate-300 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Specification Modal - WP-008 */}
      <LoadSpecificationModal
        isOpen={showLoadModal}
        specifications={savedSpecifications}
        onLoad={handleLoadSpecification}
        onClose={handleLoadModalClose}
        onDelete={handleDeleteSpecification}
      />

      {/* Header - Application title and welcome message */}
      <header className="text-center pt-16 pb-12">
        <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-4">
          Stop Cri Studio
        </h1>
        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto px-4">
          Create and manage OpenAPI specifications with ease. Build comprehensive API documentation offline, right in your browser.
        </p>
      </header>

      {/* Main content with three action buttons */}
      <main className="flex justify-center items-center min-h-[calc(100vh-280px)] px-4 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl">
          {/* Create new specification button - WP-002 */}
          <button
            onClick={handleCreateNew}
            className="group p-8 bg-white rounded-lg shadow-lg hover:shadow-2xl transition-all duration-200 transform hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50"
            aria-label="Create a new OpenAPI specification"
          >
            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-200">✨</div>
            <h2 className="text-2xl font-semibold text-slate-900 mb-2">Create</h2>
            <p className="text-slate-600 text-base">
              Start a new OpenAPI specification from scratch
            </p>
          </button>

          {/* Load existing specification button - WP-008 */}
          <button
            onClick={handleLoadSavedSpecification}
            className="group p-8 bg-white rounded-lg shadow-lg hover:shadow-2xl transition-all duration-200 transform hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50"
            aria-label="Load a previously saved specification"
          >
            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-200">📂</div>
            <h2 className="text-2xl font-semibold text-slate-900 mb-2">Load</h2>
            <p className="text-slate-600 text-base">
              Continue working on a saved specification
            </p>
          </button>

          {/* Load file specification button - WP-007 */}
          <button
            onClick={handleLoadFile}
            className="group p-8 bg-white rounded-lg shadow-lg hover:shadow-2xl transition-all duration-200 transform hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50"
            aria-label="Load an existing OpenAPI specification file"
          >
            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-200">📥</div>
            <h2 className="text-2xl font-semibold text-slate-900 mb-2">Load File</h2>
            <p className="text-slate-600 text-base">
              Import an OpenAPI YAML or JSON file
            </p>
          </button>
        </div>
      </main>
    </div>
  )
}

export default App

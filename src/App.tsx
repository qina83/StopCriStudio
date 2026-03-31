import React, { useState } from 'react'
import { OpenAPISpecification } from './types'
import { SpecificationEditor } from './components/SpecificationEditor/SpecificationEditor'
import { createNewSpecification } from './services/storageService'

/**
 * App Component
 * Main application entry point implementing WP-001 and WP-002
 */
function App() {
  const [currentView, setCurrentView] = useState<'welcome' | 'editor'>('welcome')
  const [currentSpecification, setCurrentSpecification] = useState<OpenAPISpecification | null>(null)

  const handleCreateNew = () => {
    // Create a new specification
    const newSpec = createNewSpecification('Untitled API')
    setCurrentSpecification(newSpec)
    setCurrentView('editor')
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
      {/* Header - Application title and welcome message */}
      <header className="text-center pt-16 pb-12">
        <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-4">
          Stop Cri Studio
        </h1>
        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto px-4">
          Create and manage OpenAPI specifications with ease. Build comprehensive API documentation offline, right in your browser.
        </p>
      </header>

      {/* Main content with two action buttons */}
      <main className="flex justify-center items-center min-h-[calc(100vh-280px)] px-4 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-2xl">
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

          {/* Load existing specification button - WP-003 */}
          <button
            onClick={() => {
              // TODO: Show load modal (WP-003)
              console.log('Load existing specification')
            }}
            className="group p-8 bg-white rounded-lg shadow-lg hover:shadow-2xl transition-all duration-200 transform hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50"
            aria-label="Load a previously saved specification"
          >
            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-200">📂</div>
            <h2 className="text-2xl font-semibold text-slate-900 mb-2">Load</h2>
            <p className="text-slate-600 text-base">
              Continue working on a saved specification
            </p>
          </button>
        </div>
      </main>
    </div>
  )
}

export default App

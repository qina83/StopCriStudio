import React from 'react'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">OpenAPI Visual Editor</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Welcome to the OpenAPI Visual Editor
          </h2>
          <p className="text-gray-600 mb-8">
            Create and edit OpenAPI specifications with an intuitive visual interface.
          </p>

          <div className="space-y-4">
            <button
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              onClick={() => console.log('Create new API')}
            >
              Create New API
            </button>

            <button
              className="inline-flex ml-4 items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              onClick={() => console.log('Upload existing file')}
            >
              Upload Existing File
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

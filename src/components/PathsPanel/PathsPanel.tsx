/**
 * PathsPanel Component
 * Manages API paths and operations in the specification
 * Implements WP-002.1, WP-002.2, WP-002.3, WP-002.4
 */

import React, { useState } from 'react'
import { OpenAPISpecification, HTTPMethod, PathOperation } from '../../types'
import { PathEditForm } from './PathEditForm'

const HTTP_METHODS: HTTPMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']

interface PathsPanelProps {
  specification: OpenAPISpecification
  onUpdateSpecification?: (updater: (spec: OpenAPISpecification) => OpenAPISpecification) => void
  viewMode?: 'form' | 'list'
  onViewModeChange?: (mode: 'form' | 'list') => void
}

type ViewMode = 'form' | 'list'

export function PathsPanel({
  specification,
  onUpdateSpecification,
  viewMode: externalViewMode,
  onViewModeChange,
}: PathsPanelProps) {
  // View mode state - WP-002.1
  // Use external view mode if provided (controlled by parent), otherwise manage internally
  const [internalViewMode, setInternalViewMode] = useState<ViewMode>('list')
  const viewMode = externalViewMode ?? internalViewMode

  const setViewMode = (mode: ViewMode) => {
    if (externalViewMode === undefined) {
      setInternalViewMode(mode)
    }
    onViewModeChange?.(mode)
  }
  
  // Path creation state
  const [newPathName, setNewPathName] = useState('')

  // Path selection state - WP-002.2, WP-002.4
  const [selectedPath, setSelectedPath] = useState<string | null>(null)

  const paths = (specification.content.paths as Record<string, any>) || {}
  const pathCount = Object.keys(paths).length

  // Helpers
  const getPathOperations = (path: string): Record<string, PathOperation> => {
    const pathObj = paths[path] || {}
    const httpMethods = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options']
    return Object.entries(pathObj)
      .filter(([key]) => httpMethods.includes(key))
      .reduce((acc, [key, value]) => {
        acc[key.toUpperCase()] = value as PathOperation
        return acc
      }, {} as Record<string, PathOperation>)
  }

  const getMethodColor = (method: HTTPMethod): string => {
    const colors: Record<HTTPMethod, string> = {
      GET: 'bg-blue-100 hover:bg-blue-200 text-blue-800',
      POST: 'bg-green-100 hover:bg-green-200 text-green-800',
      PUT: 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800',
      DELETE: 'bg-red-100 hover:bg-red-200 text-red-800',
      PATCH: 'bg-purple-100 hover:bg-purple-200 text-purple-800',
      HEAD: 'bg-gray-100 hover:bg-gray-200 text-gray-800',
      OPTIONS: 'bg-indigo-100 hover:bg-indigo-200 text-indigo-800',
    }
    return colors[method]
  }

  // Handlers for WP-002.1
  const handleAddPathClick = () => {
    setViewMode('form')
    setNewPathName('')
  }

  const handleCreatePath = () => {
    if (newPathName.trim() && onUpdateSpecification) {
      onUpdateSpecification((spec) => {
        const updatedPaths = { ...(spec.content.paths as Record<string, any>) || {} }
        updatedPaths[newPathName] = {}
        return {
          ...spec,
          content: {
            ...spec.content,
            paths: updatedPaths,
          },
          updatedAt: Date.now(),
        }
      })
      // After creating path, automatically select it to open the edit form (WP-002.4)
      setSelectedPath(newPathName)
      setNewPathName('')
      // Switch to list mode so PathEditForm is shown
      setViewMode('list')
    }
  }

  const handleCancelCreate = () => {
    setNewPathName('')
    setViewMode('list')
  }

  // Handlers for WP-002.2
  const handleSelectPath = (pathName: string) => {
    setSelectedPath(pathName)
  }

  // Get operations for selected path (WP-002.4)
  const getOperationsForEditForm = (): Record<HTTPMethod, PathOperation | undefined> => {
    if (!selectedPath) {
      // Return empty record with all HTTP methods set to undefined
      const emptyOps: Record<HTTPMethod, PathOperation | undefined> = {} as Record<HTTPMethod, PathOperation | undefined>
      HTTP_METHODS.forEach((method) => {
        emptyOps[method] = undefined
      })
      return emptyOps
    }
    const pathObj = paths[selectedPath] || {}
    const result: Record<HTTPMethod, PathOperation | undefined> = {} as Record<HTTPMethod, PathOperation | undefined>
    HTTP_METHODS.forEach((method) => {
      result[method] = pathObj[method.toLowerCase()]
    })
    return result
  }

  // Handle add operation from PathEditForm (WP-002.4)
  const handleAddOperationFromForm = (method: HTTPMethod) => {
    if (selectedPath && onUpdateSpecification) {
      onUpdateSpecification((spec) => {
        const updatedPaths = { ...(spec.content.paths as Record<string, any>) }
        const pathObj = updatedPaths[selectedPath] || {}

        updatedPaths[selectedPath] = {
          ...pathObj,
          [method.toLowerCase()]: {
            summary: `${method} operation`,
            description: '',
            tags: [],
            responses: {
              '200': {
                description: 'Successful response',
              },
            },
          } as PathOperation,
        }

        return {
          ...spec,
          content: {
            ...spec.content,
            paths: updatedPaths,
          },
          updatedAt: Date.now(),
        }
      })
    }
  }

  // Handle delete operation from PathEditForm (WP-002.4)
  const handleDeleteOperationFromForm = (method: HTTPMethod) => {
    if (selectedPath && onUpdateSpecification) {
      onUpdateSpecification((spec) => {
        const updatedPaths = { ...(spec.content.paths as Record<string, any>) }
        const pathObj = updatedPaths[selectedPath] || {}
        const updatedPathObj = { ...pathObj }
        delete updatedPathObj[method.toLowerCase()]

        updatedPaths[selectedPath] = updatedPathObj

        return {
          ...spec,
          content: {
            ...spec.content,
            paths: updatedPaths,
          },
          updatedAt: Date.now(),
        }
      })
    }
  }

  return (
    <div className="p-8 bg-white flex-1 overflow-y-auto">
      <div className="max-w-4xl">
        {/* WP-002.4: Show PathEditForm when a path is selected */}
        {selectedPath !== null ? (
          <PathEditForm
            pathName={selectedPath}
            operations={getOperationsForEditForm()}
            onAddOperation={handleAddOperationFromForm}
            onDeleteOperation={handleDeleteOperationFromForm}
            onClose={() => setSelectedPath(null)}
          />
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-3xl font-bold text-slate-900">API Paths</h2>
              {viewMode === 'list' && (
                <button
                  onClick={handleAddPathClick}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  + Add Path
                </button>
              )}
            </div>
            <p className="text-slate-500 mb-8">Define the endpoints and operations available in your API</p>

            {/* WP-002.1: Form view - only shown when creating new path */}
            {viewMode === 'form' && (
              <div className="mb-8 p-8 bg-slate-50 rounded-lg border border-slate-200">
                <h3 className="text-xl font-semibold text-slate-900 mb-6">Create New Path</h3>

                {/* Path name input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Path Name</label>
                  <input
                    type="text"
                    value={newPathName}
                    onChange={(e) => setNewPathName(e.target.value)}
                    placeholder="/users"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreatePath()
                    }}
                    autoFocus
                  />
                  <p className="text-xs text-slate-500 mt-1">e.g., /users, /products/{'{id}'}, /api/v1/items</p>
                </div>

                {/* Create path button */}
                <button
                  onClick={handleCreatePath}
                  disabled={!newPathName.trim()}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors font-medium mb-4"
                >
                  Create Path
                </button>

                {/* Cancel button */}
                <button
                  onClick={handleCancelCreate}
                  className="w-full px-4 py-2 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* WP-002.1 & WP-002.2: List view - only shown when not creating */}
            {viewMode === 'list' && (
              <>
                {/* Empty state */}
                {pathCount === 0 && (
                  <div className="p-8 text-center border-2 border-dashed border-slate-300 rounded-lg bg-slate-50">
                    <div className="text-4xl mb-3">📍</div>
                    <p className="text-slate-600 font-medium mb-2">No paths defined yet</p>
                    <p className="text-slate-500 text-sm">Click the "Add Path" button to define your first API endpoint</p>
                  </div>
                )}

                {/* Paths List */}
                {pathCount > 0 && (
                  <div className="space-y-4">
                    {Object.keys(paths).map((pathName) => {
                      const pathOps = getPathOperations(pathName)
                      const methodNames = Object.keys(pathOps) as HTTPMethod[]

                      return (
                        <div
                          key={pathName}
                          onClick={() => handleSelectPath(pathName)}
                          className="p-4 border border-slate-200 rounded-lg cursor-pointer hover:border-slate-300 hover:shadow-md bg-white transition-colors"
                        >
                          {/* Path name */}
                          <div className="font-mono text-lg font-semibold text-slate-900 mb-3">
                            <span>{pathName}</span>
                          </div>

                          {/* Operations list */}
                          {methodNames.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {methodNames.map((method) => (
                                <span
                                  key={method}
                                  className={`px-3 py-1 rounded-lg font-semibold text-sm ${getMethodColor(
                                    method as HTTPMethod
                                  )}`}
                                >
                                  {method}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-slate-500">No operations defined</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Information box */}
        {selectedPath === null && (
          <div className="mt-8 p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <h3 className="font-semibold text-slate-900 mb-2">About Paths</h3>
            <p className="text-sm text-slate-600">
              Paths represent the resources and endpoints available in your API. Each path can support different HTTP
              methods (GET, POST, PUT, DELETE, etc.) with their own operation details.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

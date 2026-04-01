/**
 * PathsPanel Component
 * Manages API paths and operations in the specification
 * Implements WP-002.1, WP-002.2, WP-002.3
 */

import React, { useState } from 'react'
import { OpenAPISpecification, HTTPMethod, PathOperation } from '../../types'

const HTTP_METHODS: HTTPMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']

interface PathsPanelProps {
  specification: OpenAPISpecification
  onUpdateSpecification?: (updater: (spec: OpenAPISpecification) => OpenAPISpecification) => void
  viewMode?: 'form' | 'list'
  onViewModeChange?: (mode: 'form' | 'list') => void
}

type ViewMode = 'form' | 'list'

/**
 * Modal for adding a new operation to a path
 */
function AddOperationModal({
  isOpen,
  pathName,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean
  pathName: string
  onConfirm: (method: HTTPMethod, summary: string, description: string) => void
  onCancel: () => void
}) {
  const [selectedMethod, setSelectedMethod] = useState<HTTPMethod | null>(null)
  const [summary, setSummary] = useState('')
  const [description, setDescription] = useState('')

  const handleConfirm = () => {
    if (selectedMethod && summary.trim()) {
      onConfirm(selectedMethod, summary, description)
      setSelectedMethod(null)
      setSummary('')
      setDescription('')
    }
  }

  const handleCancel = () => {
    setSelectedMethod(null)
    setSummary('')
    setDescription('')
    onCancel()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4">
        <div className="bg-blue-600 text-white p-6">
          <h2 className="text-2xl font-bold">Add Operation</h2>
          <p className="text-opacity-90 font-mono text-sm">{pathName}</p>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">HTTP Method</label>
            <select
              value={selectedMethod || ''}
              onChange={(e) => setSelectedMethod(e.target.value as HTTPMethod)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">Select a method</option>
              {HTTP_METHODS.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Summary</label>
            <input
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Operation summary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
              placeholder="Operation description (optional)"
              rows={3}
            />
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex gap-3 justify-end">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedMethod || !summary.trim()}
            className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-lg transition-colors font-medium"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Modal for deleting an operation
 */
function DeleteOperationModal({
  isOpen,
  method,
  pathName,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean
  method: HTTPMethod | null
  pathName: string
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!isOpen || !method) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4">
        <div className="bg-red-600 text-white p-6">
          <h2 className="text-2xl font-bold">Delete Operation</h2>
        </div>

        <div className="p-6">
          <p className="text-slate-700 mb-4">
            Are you sure you want to delete the <strong>{method}</strong> operation from <strong>{pathName}</strong>?
          </p>
          <p className="text-sm text-slate-500">This action cannot be undone.</p>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors font-medium"
          >
            Confirm Delete
          </button>
        </div>
      </div>
    </div>
  )
}

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
  
  // Path selection state - WP-002.2
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  
  // Operation management state - WP-002.3
  const [showAddOperationModal, setShowAddOperationModal] = useState(false)
  const [selectedOperation, setSelectedOperation] = useState<HTTPMethod | null>(null)
  const [showDeleteOperationModal, setShowDeleteOperationModal] = useState(false)

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
      // After creating path, automatically select it (WP-002.2)
      setSelectedPath(newPathName)
      setNewPathName('')
      // Keep form visible to show the newly created path with operations section
    }
  }

  const handleCancelCreate = () => {
    setNewPathName('')
    setViewMode('list')
  }

  // Handlers for WP-002.2
  const handleSelectPath = (pathName: string) => {
    setSelectedPath(selectedPath === pathName ? null : pathName)
  }

  // Handlers for WP-002.3
  const handleAddOperationConfirm = (method: HTTPMethod, summary: string, description: string) => {
    if (selectedPath && onUpdateSpecification) {
      onUpdateSpecification((spec) => {
        const updatedPaths = { ...(spec.content.paths as Record<string, any>) }
        const pathObj = updatedPaths[selectedPath] || {}

        updatedPaths[selectedPath] = {
          ...pathObj,
          [method.toLowerCase()]: {
            summary,
            description,
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
      setShowAddOperationModal(false)
    }
  }

  const handleDeleteOperationConfirm = () => {
    if (selectedPath && selectedOperation && onUpdateSpecification) {
      onUpdateSpecification((spec) => {
        const updatedPaths = { ...(spec.content.paths as Record<string, any>) }
        const pathObj = updatedPaths[selectedPath] || {}
        const updatedPathObj = { ...pathObj }
        delete updatedPathObj[selectedOperation.toLowerCase()]

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
      setShowDeleteOperationModal(false)
      setSelectedOperation(null)
    }
  }

  return (
    <div className="p-8 bg-white flex-1 overflow-y-auto">
      <div className="max-w-4xl">
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

        {/* WP-002.1 & WP-002.2 & WP-002.3: List view - only shown when not creating */}
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
                  const isSelected = selectedPath === pathName

                  return (
                    <div
                      key={pathName}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                      onClick={() => handleSelectPath(pathName)}
                    >
                      {/* Path name */}
                      <div className="font-mono text-lg font-semibold text-slate-900 mb-3 flex items-center justify-between">
                        <span>{pathName}</span>
                        {isSelected && <span className="text-sm text-blue-600 font-normal">Selected</span>}
                      </div>

                      {/* Operations list */}
                      {methodNames.length > 0 ? (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {methodNames.map((method) => (
                            <button
                              key={method}
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedOperation(selectedOperation === method ? null : method)
                              }}
                              className={`px-3 py-1 rounded-lg font-semibold text-sm transition-all ${
                                getMethodColor(method as HTTPMethod)
                              } ${
                                selectedOperation === method && isSelected
                                  ? 'ring-2 ring-offset-1 ring-blue-600 shadow-md'
                                  : ''
                              }`}
                            >
                              {method}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500 mb-4">No operations defined</p>
                      )}

                      {/* WP-002.2: Operations section for selected path */}
                      {isSelected && (
                        <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
                          {/* Operation details when selected */}
                          {selectedOperation && pathOps[selectedOperation] && (
                            <div className="p-3 bg-slate-100 rounded-lg border border-slate-200 space-y-2">
                              <h4 className="font-semibold text-slate-900">{selectedOperation} Details</h4>
                              <p className="text-sm text-slate-700">
                                <strong>Summary:</strong> {pathOps[selectedOperation]?.summary}
                              </p>
                              {pathOps[selectedOperation]?.description && (
                                <p className="text-sm text-slate-700">
                                  <strong>Description:</strong> {pathOps[selectedOperation]?.description}
                                </p>
                              )}

                              {/* WP-002.3: Delete Operation button - only visible when operation is selected */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setShowDeleteOperationModal(true)
                                }}
                                className="mt-2 w-full px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
                              >
                                Delete Operation
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* Information box */}
        <div className="mt-8 p-4 bg-slate-50 border border-slate-200 rounded-lg">
          <h3 className="font-semibold text-slate-900 mb-2">About Paths</h3>
          <p className="text-sm text-slate-600">
            Paths represent the resources and endpoints available in your API. Each path can support different HTTP
            methods (GET, POST, PUT, DELETE, etc.) with their own operation details.
          </p>
        </div>

        {/* Modals - WP-002.3 */}
        <AddOperationModal
          isOpen={showAddOperationModal && selectedPath !== null}
          pathName={selectedPath || ''}
          onConfirm={handleAddOperationConfirm}
          onCancel={() => setShowAddOperationModal(false)}
        />

        <DeleteOperationModal
          isOpen={showDeleteOperationModal && selectedOperation !== null}
          method={selectedOperation}
          pathName={selectedPath || ''}
          onConfirm={handleDeleteOperationConfirm}
          onCancel={() => setShowDeleteOperationModal(false)}
        />
      </div>
    </div>
  )
}

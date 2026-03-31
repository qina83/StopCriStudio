/**
 * PathsPanel Component
 * Manages API paths and operations in the specification (WP-003)
 */

import React, { useState } from 'react'
import { OpenAPISpecification, HTTPMethod, PathOperation } from '../../types'

const HTTP_METHODS: HTTPMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']

interface PathsPanelProps {
  specification: OpenAPISpecification
  onUpdateSpecification?: (updater: (spec: OpenAPISpecification) => OpenAPISpecification) => void
}

export function PathsPanel({
  specification,
  onUpdateSpecification,
}: PathsPanelProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [pathName, setPathName] = useState('')
  const [selectedMethod, setSelectedMethod] = useState<HTTPMethod | null>(null)
  const [operationSummary, setOperationSummary] = useState('')
  const [operationDescription, setOperationDescription] = useState('')
  const [operations, setOperations] = useState<Set<HTTPMethod>>(new Set())
  const [selectedOperation, setSelectedOperation] = useState<HTTPMethod | null>(null)

  const paths = (specification.content.paths as Record<string, any>) || {}
  const pathCount = Object.keys(paths).length

  const handleCreatePath = () => {
    if (pathName.trim() && onUpdateSpecification) {
      onUpdateSpecification((spec) => {
        const updatedPaths = { ...paths }
        updatedPaths[pathName] = {}
        return {
          ...spec,
          content: {
            ...spec.content,
            paths: updatedPaths,
          },
          updatedAt: Date.now(),
        }
      })
      setPathName('')
      setIsCreating(false)
      setOperations(new Set())
    }
  }

  const handleStartMethodClick = (method: HTTPMethod) => {
    setSelectedMethod(method)
    setOperationSummary(`${method} operation on ${pathName}`)
    setOperationDescription('')
  }

  const handleConfirmOperation = () => {
    if (selectedMethod && pathName.trim() && onUpdateSpecification) {
      onUpdateSpecification((spec) => {
        const updatedPaths = { ...(spec.content.paths as Record<string, any>) }
        const pathObj = updatedPaths[pathName] || {}

        updatedPaths[pathName] = {
          ...pathObj,
          [selectedMethod.toLowerCase()]: {
            summary: operationSummary,
            description: operationDescription,
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

      setOperations((prev) => new Set([...prev, selectedMethod]))
      setSelectedMethod(null)
      setOperationSummary('')
      setOperationDescription('')
    }
  }

  const handleCancelOperation = () => {
    setSelectedMethod(null)
    setOperationSummary('')
    setOperationDescription('')
  }

  const getMethodColor = (method: HTTPMethod): string => {
    const colors: Record<HTTPMethod, string> = {
      GET: 'bg-blue-100 text-blue-800',
      POST: 'bg-green-100 text-green-800',
      PUT: 'bg-yellow-100 text-yellow-800',
      DELETE: 'bg-red-100 text-red-800',
      PATCH: 'bg-purple-100 text-purple-800',
      HEAD: 'bg-gray-100 text-gray-800',
      OPTIONS: 'bg-indigo-100 text-indigo-800',
    }
    return colors[method]
  }

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

  return (
    <div className="p-8 bg-white flex-1 overflow-y-auto">
      <div className="max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-3xl font-bold text-slate-900">API Paths</h2>
          {!isCreating && (
            <button
              onClick={() => setIsCreating(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              + Add Path
            </button>
          )}
        </div>
        <p className="text-slate-500 mb-8">Define the endpoints and operations available in your API</p>

        {/* Create Path Form */}
        {isCreating && (
          <div className="mb-8 p-8 bg-slate-50 rounded-lg border border-slate-200">
            <h3 className="text-xl font-semibold text-slate-900 mb-6">Create New Path</h3>

            {/* Path name input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">Path Name</label>
              <input
                type="text"
                value={pathName}
                onChange={(e) => setPathName(e.target.value)}
                placeholder="/users"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreatePath()
                }}
              />
              <p className="text-xs text-slate-500 mt-1">e.g., /users, /products/{'{id}'}, /api/v1/items</p>
            </div>

            {/* Create path button */}
            <button
              onClick={handleCreatePath}
              disabled={!pathName.trim()}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors font-medium mb-8"
            >
              Create Path
            </button>

            {/* HTTP Methods */}
            <div className="border-t border-slate-300 pt-6">
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Add Operations</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {HTTP_METHODS.map((method) => (
                  <button
                    key={method}
                    onClick={() => handleStartMethodClick(method)}
                    className={`px-3 py-2 rounded-lg font-semibold text-sm transition-all ${
                      getMethodColor(method)
                    } hover:shadow-md ${
                      operations.has(method) ? 'ring-2 ring-offset-1 ring-slate-400' : ''
                    }`}
                    title={`Add ${method} operation`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* Cancel button */}
            <button
              onClick={() => {
                setIsCreating(false)
                setPathName('')
                setOperations(new Set())
                setSelectedMethod(null)
              }}
              className="mt-6 px-4 py-2 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Operation Modal */}
        {selectedMethod && isCreating && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4">
              <div className="bg-blue-600 text-white p-6">
                <h2 className="text-2xl font-bold">{selectedMethod}</h2>
                <p className="text-opacity-90 font-mono text-sm">{pathName}</p>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Summary</label>
                  <input
                    type="text"
                    value={operationSummary}
                    onChange={(e) => setOperationSummary(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Operation summary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea
                    value={operationDescription}
                    onChange={(e) => setOperationDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                    placeholder="Operation description"
                    rows={3}
                  />
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex gap-3 justify-end">
                <button
                  onClick={handleCancelOperation}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmOperation}
                  className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors font-medium"
                >
                  Create Operation
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Paths List */}
        {pathCount === 0 && !isCreating ? (
          <div className="p-8 text-center border-2 border-dashed border-slate-300 rounded-lg bg-slate-50">
            <div className="text-4xl mb-3">📍</div>
            <p className="text-slate-600 font-medium mb-2">No paths defined yet</p>
            <p className="text-slate-500 text-sm">Click the "Add Path" button to define your first API endpoint</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.keys(paths).map((pathName) => {
              const pathOps = getPathOperations(pathName)
              const methodNames = Object.keys(pathOps) as HTTPMethod[]

              return (
                <div key={pathName} className="p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
                  <div className="font-mono text-lg font-semibold text-slate-900 mb-3">{pathName}</div>

                  {/* Operations */}
                  {methodNames.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {methodNames.map((method) => (
                        <button
                          key={method}
                          onClick={() => setSelectedOperation(selectedOperation === method ? null : method)}
                          className={`px-3 py-1 rounded-lg font-semibold text-sm transition-all ${
                            getMethodColor(method as HTTPMethod)
                          } ${
                            selectedOperation === method
                              ? 'ring-2 ring-offset-1 ring-blue-500 shadow-md'
                              : 'hover:shadow-sm'
                          }`}
                        >
                          {method}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">No operations defined</p>
                  )}

                  {/* Operation Details */}
                  {selectedOperation && pathOps[selectedOperation] && (
                    <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <h4 className="font-semibold text-slate-900 mb-2">{selectedOperation} Details</h4>
                      <p className="text-sm text-slate-700 mb-2">
                        <strong>Summary:</strong> {pathOps[selectedOperation]?.summary}
                      </p>
                      {pathOps[selectedOperation]?.description && (
                        <p className="text-sm text-slate-700">
                          <strong>Description:</strong> {pathOps[selectedOperation]?.description}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Information box */}
        <div className="mt-8 p-4 bg-slate-50 border border-slate-200 rounded-lg">
          <h3 className="font-semibold text-slate-900 mb-2">About Paths</h3>
          <p className="text-sm text-slate-600">
            Paths represent the resources and endpoints available in your API. Each path can support different HTTP
            methods (GET, POST, PUT, DELETE, etc.) with their own operation details.
          </p>
        </div>
      </div>
    </div>
  )
}

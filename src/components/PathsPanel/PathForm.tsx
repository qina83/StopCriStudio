/**
 * PathForm Component
 * Form for creating a new API path
 */

import React, { useState } from 'react'
import { HTTPMethod } from '../../types'

const HTTP_METHODS: HTTPMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']

interface PathFormProps {
  onPathCreate: (pathName: string) => void
  onOperationAdd: (method: HTTPMethod) => void
  operations: Set<HTTPMethod>
}

export function PathForm({ onPathCreate, onOperationAdd, operations }: PathFormProps) {
  const [pathName, setPathName] = useState('')

  const handleCreatePath = () => {
    if (pathName.trim()) {
      onPathCreate(pathName)
      setPathName('')
    }
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

  return (
    <div className="p-8 bg-white rounded-lg border border-slate-200">
      <h3 className="text-xl font-semibold text-slate-900 mb-6">Create New Path</h3>

      {/* Path name input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Path Name
        </label>
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
        <p className="text-xs text-slate-500 mt-1">
          e.g., /users, /products/{'{id}'}, /api/v1/items
        </p>
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
      <div className="border-t border-slate-200 pt-6">
        <h4 className="text-sm font-semibold text-slate-700 mb-3">Add Operations</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {HTTP_METHODS.map((method) => (
            <button
              key={method}
              onClick={() => onOperationAdd(method)}
              className={`px-3 py-2 rounded-lg font-semibold text-sm transition-all ${getMethodColor(
                method
              )} ${operations.has(method) ? 'ring-2 ring-offset-1 ring-slate-400' : ''}`}
              title={`Add ${method} operation`}
            >
              {method}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

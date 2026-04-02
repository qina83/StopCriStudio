/**
 * PathEditForm Component
 * Implements WP-002.4: Edit path with operation management form
 * Shows all available HTTP methods as buttons and allows adding/removing operations
 * Implements WP-005: Allow inline editing of path names
 */

import React, { useState, useRef } from 'react'
import { HTTPMethod, PathOperation } from '../../types'

const HTTP_METHODS: HTTPMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']

interface PathEditFormProps {
  pathName: string
  operations: Record<HTTPMethod, PathOperation | undefined>
  onAddOperation: (method: HTTPMethod) => void
  onDeleteOperation: (method: HTTPMethod) => void
  onRenamePathName?: (newPathName: string) => { success: boolean; error?: string }
  onClose: () => void
}

/**
 * Confirmation modal for adding an operation
 */
function AddOperationConfirmModal({
  isOpen,
  method,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean
  method: HTTPMethod | null
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!isOpen || !method) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full mx-4">
        <div className="bg-blue-600 text-white p-6">
          <h2 className="text-2xl font-bold">Add {method} Operation?</h2>
        </div>

        <div className="p-6">
          <p className="text-slate-700">
            Add a new <strong>{method}</strong> operation to this path?
          </p>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors font-medium"
          >
            No
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors font-medium"
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Confirmation modal for deleting an operation
 */
function DeleteOperationConfirmModal({
  isOpen,
  method,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean
  method: HTTPMethod | null
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!isOpen || !method) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full mx-4">
        <div className="bg-red-600 text-white p-6">
          <h2 className="text-2xl font-bold">Delete Operation</h2>
        </div>

        <div className="p-6">
          <p className="text-slate-700 mb-4">
            Are you sure you want to delete the <strong>{method}</strong> operation?
          </p>
          <p className="text-sm text-red-600 font-medium">⚠️ This action cannot be undone.</p>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors font-medium"
          >
            No
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors font-medium"
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  )
}

export function PathEditForm({
  pathName,
  operations,
  onAddOperation,
  onDeleteOperation,
  onRenamePathName,
  onClose,
}: PathEditFormProps) {
  const [selectedOperation, setSelectedOperation] = useState<HTTPMethod | null>(null)
  const [showAddConfirmModal, setShowAddConfirmModal] = useState(false)
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false)
  const [methodToAdd, setMethodToAdd] = useState<HTTPMethod | null>(null)
  
  // WP-005: Inline path name editing
  const [isEditingPathName, setIsEditingPathName] = useState(false)
  const [editedPathName, setEditedPathName] = useState(pathName)
  const [pathNameError, setPathNameError] = useState<string | null>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  const getMethodColor = (method: HTTPMethod, isAdded: boolean): string => {
    if (isAdded) {
      // Added methods (colored state)
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
    } else {
      // Available methods (not yet added - gray state, clickable)
      return 'bg-slate-200 hover:bg-slate-300 text-slate-600 cursor-pointer'
    }
  }

  const getMethodTextColor = (method: HTTPMethod): string => {
    const colors: Record<HTTPMethod, string> = {
      GET: 'text-blue-600',
      POST: 'text-green-600',
      PUT: 'text-yellow-600',
      DELETE: 'text-red-600',
      PATCH: 'text-purple-600',
      HEAD: 'text-gray-600',
      OPTIONS: 'text-indigo-600',
    }
    return colors[method]
  }

  const handleMethodButtonClick = (method: HTTPMethod) => {
    const isAdded = operations[method] !== undefined
    if (!isAdded) {
      setMethodToAdd(method)
      setShowAddConfirmModal(true)
    }
  }

  const handleAddConfirm = () => {
    if (methodToAdd) {
      onAddOperation(methodToAdd)
      // Auto-select the newly created operation
      setSelectedOperation(methodToAdd)
      setShowAddConfirmModal(false)
      setMethodToAdd(null)
    }
  }

  const handleDeleteConfirm = () => {
    if (selectedOperation) {
      onDeleteOperation(selectedOperation)
      setShowDeleteConfirmModal(false)
      setSelectedOperation(null)
    }
  }

  // WP-005: Path name editing handlers
  const handleStartEditingPathName = () => {
    setIsEditingPathName(true)
    setEditedPathName(pathName)
    setPathNameError(null)
    // Focus input after state update
    setTimeout(() => {
      editInputRef.current?.focus()
      editInputRef.current?.select()
    }, 0)
  }

  const validatePathName = (name: string): string | null => {
    // Trim whitespace
    const trimmed = name.trim()
    
    // Check if empty
    if (!trimmed) {
      return 'Path name cannot be empty'
    }
    
    // Check for invalid characters (allow alphanumeric, /, -, _, {}, .)
    if (!/^[a-zA-Z0-9\-_./{}\s]+$/.test(trimmed)) {
      return 'Path name contains invalid characters. Only alphanumeric, /, -, _, {}, and . are allowed'
    }
    
    return null
  }

  const handleSavePathName = () => {
    // Validate
    const error = validatePathName(editedPathName)
    if (error) {
      setPathNameError(error)
      return
    }

    const trimmedName = editedPathName.trim()

    // If no change, just cancel
    if (trimmedName === pathName) {
      setIsEditingPathName(false)
      setPathNameError(null)
      return
    }

    // Call handler to rename path
    if (onRenamePathName) {
      const result = onRenamePathName(trimmedName)
      if (result.success) {
        setIsEditingPathName(false)
        setPathNameError(null)
        setEditedPathName(trimmedName)
      } else {
        setPathNameError(result.error || 'Failed to rename path')
      }
    }
  }

  const handleCancelEditingPathName = () => {
    setIsEditingPathName(false)
    setPathNameError(null)
    setEditedPathName(pathName)
  }

  const handleKeyDownInPathNameInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSavePathName()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancelEditingPathName()
    }
  }

  return (
    <div className="p-8 bg-white rounded-lg border border-slate-200">
      {/* Header with close button */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-slate-900">Edit Path</h2>
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-slate-700 text-2xl font-bold"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {/* Path Name Display - WP-005: Add inline editing */}
      <div className="mb-8 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <p className="text-sm font-medium text-slate-600 mb-1">Path</p>
        
        {!isEditingPathName ? (
          // Display mode
          <div className="flex items-center justify-between">
            <p className="text-2xl font-mono font-bold text-slate-900">{pathName}</p>
            {/* Edit icon button - WP-005 */}
            <button
              onClick={handleStartEditingPathName}
              className="ml-4 p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors"
              title="Edit path name"
              aria-label="Edit path name"
            >
              {/* Pencil icon */}
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </button>
          </div>
        ) : (
          // Edit mode - WP-005
          <div className="space-y-3">
            <div className="flex gap-2 items-start">
              <div className="flex-1">
                <input
                  ref={editInputRef}
                  type="text"
                  value={editedPathName}
                  onChange={(e) => {
                    setEditedPathName(e.target.value)
                    if (pathNameError) setPathNameError(null)
                  }}
                  onKeyDown={handleKeyDownInPathNameInput}
                  placeholder="/api/resource"
                  className="w-full px-3 py-2 font-mono font-bold text-lg border-2 border-blue-500 rounded-lg focus:outline-none bg-white"
                />
              </div>
              {/* Confirm button (checkmark) */}
              <button
                onClick={handleSavePathName}
                className="p-2 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-lg transition-colors font-bold text-lg"
                title="Save path name (Enter)"
                aria-label="Confirm path name change"
              >
                ✓
              </button>
              {/* Cancel button (X) */}
              <button
                onClick={handleCancelEditingPathName}
                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-colors font-bold text-lg"
                title="Cancel editing (Escape)"
                aria-label="Cancel path name change"
              >
                ✕
              </button>
            </div>
            
            {/* Error message */}
            {pathNameError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700 font-medium">⚠️ {pathNameError}</p>
              </div>
            )}
            
            {/* Hint text */}
            <p className="text-xs text-slate-500">Press Enter to save or Escape to cancel</p>
          </div>
        )}
      </div>

      {/* HTTP Methods Section */}
      <div className="mb-8">
        <div className="flex gap-2">
          {HTTP_METHODS.map((method) => {
            const isAdded = operations[method] !== undefined
            const isSelected = selectedOperation === method
            return (
              <button
                key={method}
                onClick={() => {
                  if (isAdded) {
                    setSelectedOperation(isSelected ? null : method)
                  } else {
                    handleMethodButtonClick(method)
                  }
                }}
                className={`flex-1 py-2 px-3 rounded-lg font-bold transition-all text-sm text-center ${
                  getMethodColor(method, isAdded)
                } ${isSelected && isAdded ? 'ring-2 ring-offset-2 ring-blue-600 shadow-md' : ''}`}
              >
                <div>{method}</div>
                {isAdded ? (
                  <div className="text-xs font-normal mt-0.5 opacity-75">✓</div>
                ) : (
                  <div className="text-xs font-normal mt-0.5">+</div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected Operation Details */}
      {selectedOperation && operations[selectedOperation] && (
        <div className="mb-8 p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
          {/* Large Operation Name */}
          <div className="text-6xl font-bold mb-4">
            <span className={getMethodTextColor(selectedOperation)}>{selectedOperation}</span>
          </div>

          {/* Operation Details */}
          <div className="space-y-3 mb-6">
            {operations[selectedOperation]?.summary && (
              <div>
                <p className="text-sm font-medium text-slate-600">Summary</p>
                <p className="text-slate-900">{operations[selectedOperation]?.summary}</p>
              </div>
            )}

            {operations[selectedOperation]?.description && (
              <div>
                <p className="text-sm font-medium text-slate-600">Description</p>
                <p className="text-slate-900">{operations[selectedOperation]?.description}</p>
              </div>
            )}
          </div>

          {/* Delete Button */}
          <button
            onClick={() => setShowDeleteConfirmModal(true)}
            className="w-full px-4 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors"
          >
            Delete {selectedOperation} Operation
          </button>
        </div>
      )}

      {/* Info box */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
        <p className="text-sm text-slate-600">
          Click any available HTTP method button to add it to this path. Click an already-added method to view and
          manage its details.
        </p>
      </div>

      {/* Modals */}
      <AddOperationConfirmModal
        isOpen={showAddConfirmModal}
        method={methodToAdd}
        onConfirm={handleAddConfirm}
        onCancel={() => {
          setShowAddConfirmModal(false)
          setMethodToAdd(null)
        }}
      />

      <DeleteOperationConfirmModal
        isOpen={showDeleteConfirmModal}
        method={selectedOperation}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteConfirmModal(false)}
      />
    </div>
  )
}

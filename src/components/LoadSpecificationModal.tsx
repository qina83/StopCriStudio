/**
 * LoadSpecificationModal Component
 * Implements WP-008: Load and delete saved specifications
 * Allows users to view saved specifications in a modal list,
 * select one to load, or delete from history
 */

import React, { useState } from 'react'
import { SpecificationMetadata } from '../types'
import { deleteSpecification, getSpecification } from '../services/storageService'
import { OpenAPISpecification } from '../types'

interface LoadSpecificationModalProps {
  isOpen: boolean
  specifications: SpecificationMetadata[]
  onLoad: (specification: OpenAPISpecification) => void
  onClose: () => void
  onDelete: (id: string) => void
}

/**
 * Confirmation modal for deleting a specification
 */
function DeleteSpecificationConfirmModal({
  isOpen,
  specName,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean
  specName: string | null
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!isOpen || !specName) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full mx-4">
        <div className="bg-red-600 text-white p-6">
          <h2 className="text-2xl font-bold">Delete Specification</h2>
        </div>

        <div className="p-6">
          <p className="text-slate-700 mb-4">
            Are you sure you want to delete <strong>{specName}</strong>?
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
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export function LoadSpecificationModal({
  isOpen,
  specifications,
  onLoad,
  onClose,
  onDelete,
}: LoadSpecificationModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deleteConfirmName, setDeleteConfirmName] = useState<string | null>(null)

  if (!isOpen) return null

  const handleLoad = () => {
    if (!selectedId) return

    const spec = getSpecification(selectedId)
    if (spec) {
      onLoad(spec)
      setSelectedId(null)
    }
  }

  const handleDeleteClick = (id: string, name: string) => {
    setDeleteConfirmId(id)
    setDeleteConfirmName(name)
  }

  const handleDeleteConfirm = () => {
    if (deleteConfirmId) {
      deleteSpecification(deleteConfirmId)
      onDelete(deleteConfirmId)
      setDeleteConfirmId(null)
      setDeleteConfirmName(null)
      setSelectedId(null)
    }
  }

  const handleClose = () => {
    setSelectedId(null)
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-blue-600 text-white p-6">
            <h2 className="text-2xl font-bold">Load Saved Specification</h2>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {specifications.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-500 text-lg">No saved specifications yet</p>
                <p className="text-slate-400 text-sm mt-2">
                  Create a new specification or load a file to get started
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {specifications.map((spec) => (
                  <div
                    key={spec.id}
                    onClick={() => setSelectedId(spec.id)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      selectedId === spec.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 text-lg">{spec.name}</h3>
                        <p className="text-sm text-slate-500 mt-1">
                          v{spec.specVersion} • Updated{' '}
                          {new Date(spec.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteClick(spec.id, spec.name)
                        }}
                        className="ml-4 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex gap-3 justify-end">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleLoad}
              disabled={!selectedId || specifications.length === 0}
              className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                !selectedId || specifications.length === 0
                  ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Ok
            </button>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      <DeleteSpecificationConfirmModal
        isOpen={!!deleteConfirmId}
        specName={deleteConfirmName}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteConfirmId(null)
          setDeleteConfirmName(null)
        }}
      />
    </>
  )
}

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
import { AppButton, Badge, ConfirmDialog, EmptyState, FolderIcon, ModalShell, TrashIcon } from './ui'

interface LoadSpecificationModalProps {
  isOpen: boolean
  specifications: SpecificationMetadata[]
  onLoad: (specification: OpenAPISpecification) => void
  onClose: () => void
  onDelete: (id: string) => void
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
      <ModalShell
        open={isOpen}
        title="Load Saved Specification"
        description="Choose a local specification snapshot to reopen in the editor."
        size="lg"
        onClose={handleClose}
        footer={(
          <>
            <AppButton variant="ghost" onClick={handleClose}>Cancel</AppButton>
            <AppButton variant="primary" onClick={handleLoad} disabled={!selectedId || specifications.length === 0}>Load Specification</AppButton>
          </>
        )}
      >
        {specifications.length === 0 ? (
          <EmptyState
            icon={<FolderIcon className="h-12 w-12" />}
            title="No saved specifications yet"
            description="Create a new specification or import a file to start building a local history."
          />
        ) : (
          <div className="space-y-3">
            {specifications.map((spec) => {
              const isSelected = selectedId === spec.id

              return (
                <button
                  key={spec.id}
                  type="button"
                  onClick={() => setSelectedId(spec.id)}
                  className={`w-full rounded-xl border p-4 text-left transition-all ${
                    isSelected
                      ? 'border-focus-ring bg-sky-50 shadow-panel'
                      : 'border-border-default bg-surface-base hover:border-border-strong hover:bg-surface-raised'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="truncate text-lg font-semibold text-text-primary">{spec.name}</h3>
                        <Badge variant="status" tone={isSelected ? 'info' : 'neutral'}>
                          {isSelected ? 'Selected' : 'Saved'}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-text-secondary">
                        Version {spec.specVersion} • Updated {new Date(spec.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <AppButton
                      variant="ghost"
                      size="sm"
                      className="text-state-error hover:bg-red-50 hover:text-state-error"
                      onClick={(event) => {
                        event.stopPropagation()
                        handleDeleteClick(spec.id, spec.name)
                      }}
                      leadingIcon={<TrashIcon className="h-4 w-4" />}
                    >
                      Delete
                    </AppButton>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </ModalShell>

      <ConfirmDialog
        open={!!deleteConfirmId}
        title="Delete Specification"
        description={(
          <>
            <p>Delete <strong>{deleteConfirmName}</strong> from local storage?</p>
            <p className="mt-2">This action cannot be undone.</p>
          </>
        )}
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteConfirmId(null)
          setDeleteConfirmName(null)
        }}
      />
    </>
  )
}

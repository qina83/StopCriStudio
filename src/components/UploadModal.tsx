import React, { useRef, useState } from 'react'
import { Modal } from './Modal'
import { useSpecStore } from '@/store/specStore'
import { useToast } from './Toast'
import { parseOpenAPIFile } from '@/utils/openapi'

interface UploadModalProps {
  isOpen: boolean
  onClose: () => void
}

export function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { setSpec, saveDraft, setValidationErrors } = useSpecStore()
  const { addToast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    setErrorMessage(null)

    try {
      const { spec, errors } = await parseOpenAPIFile(file)
      setSpec(spec)
      saveDraft(spec)

      if (errors.length > 0) {
        setValidationErrors(errors)
        addToast('File loaded with validation warnings', 'info')
      } else {
        addToast('File uploaded successfully', 'success')
      }

      onClose()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to parse file'
      setErrorMessage(message)
      addToast(message, 'error')
    } finally {
      setIsLoading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload OpenAPI File">
      <div className="space-y-4">
        <p className="text-gray-600">
          Select a JSON or YAML file containing an OpenAPI 3.0 or 3.1 specification.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.yaml,.yml"
          onChange={handleFileSelect}
          className="hidden"
        />

        <button
          onClick={handleClick}
          disabled={isLoading}
          className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : 'Click to select file'}
        </button>

        {errorMessage && <div className="text-red-600 text-sm">{errorMessage}</div>}

        <div className="text-xs text-gray-500">
          <p>Supported formats: JSON (.json), YAML (.yaml, .yml)</p>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  )
}

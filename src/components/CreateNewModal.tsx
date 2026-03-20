import React, { useState } from 'react'
import { Modal } from './Modal'
import { useSpecStore, OpenAPISpec } from '@/store/specStore'
import { useToast } from './Toast'

interface CreateNewModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateNewModal({ isOpen, onClose }: CreateNewModalProps) {
  const { setSpec, saveDraft } = useSpecStore()
  const { addToast } = useToast()

  const [formData, setFormData] = useState({
    title: 'My API',
    version: '1.0.0',
    description: '',
    baseUrl: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const newSpec: OpenAPISpec = {
      openapi: '3.0.0',
      info: {
        title: formData.title,
        version: formData.version,
        description: formData.description || undefined,
      },
      servers: formData.baseUrl
        ? [
            {
              url: formData.baseUrl,
              description: 'Base URL',
            },
          ]
        : undefined,
      paths: {},
    }

    setSpec(newSpec)
    saveDraft(newSpec)
    addToast('New specification created successfully', 'success')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New API Specification">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="api-title" className="block text-sm font-medium text-gray-700 mb-1">
            API Title *
          </label>
          <input
            id="api-title"
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
            placeholder="My API"
          />
        </div>

        <div>
          <label htmlFor="api-version" className="block text-sm font-medium text-gray-700 mb-1">
            Version *
          </label>
          <input
            id="api-version"
            type="text"
            name="version"
            value={formData.version}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
            placeholder="1.0.0"
          />
        </div>

        <div>
          <label htmlFor="api-description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="api-description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
            placeholder="API description"
          />
        </div>

        <div>
          <label htmlFor="api-base-url" className="block text-sm font-medium text-gray-700 mb-1">
            Base URL
          </label>
          <input
            id="api-base-url"
            type="text"
            name="baseUrl"
            value={formData.baseUrl}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
            placeholder="https://api.example.com"
          />
        </div>

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Create
          </button>
        </div>
      </form>
    </Modal>
  )
}

import React, { useState, useEffect } from 'react'
import { useSpecStore } from '@/store/specStore'
import { useToast } from './Toast'
import { IoPencil } from 'react-icons/io5'

interface EditorProps {
  onExport: () => void
}

export function Editor({ onExport }: EditorProps) {
  const { spec, hasUnsavedChanges, lastSavedTime, saveDraft, markSpecAsModified } =
    useSpecStore()
  const { addToast } = useToast()
  const [editValue, setEditValue] = useState<string>('')

  useEffect(() => {
    if (spec) {
      setEditValue(JSON.stringify(spec, null, 2))
    }
  }, [spec])

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!spec || !hasUnsavedChanges) return

    const timer = setInterval(() => {
      try {
        const parsed = JSON.parse(editValue)
        saveDraft(parsed)
        addToast('Draft saved', 'success')
      } catch {
        // Silent fail
      }
    }, 30000)

    return () => clearInterval(timer)
  }, [spec, hasUnsavedChanges, editValue, saveDraft, addToast])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditValue(e.target.value)
    markSpecAsModified()
  }

  const handleFormatChange = () => {
    try {
      const parsed = JSON.parse(editValue)
      setEditValue(JSON.stringify(parsed, null, 2))
      addToast('Formatted successfully', 'success')
    } catch (err) {
      addToast('Invalid JSON', 'error')
    }
  }

  if (!spec) return null

  const formattedTime = lastSavedTime
    ? new Date(lastSavedTime).toLocaleTimeString()
    : 'Never'

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{spec.info.title}</h2>
          <p className="text-gray-600">Version {spec.info.version}</p>
          {spec.info.description && <p className="text-gray-600">{spec.info.description}</p>}
        </div>
        <div className="text-right">
          <button
            onClick={onExport}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 mb-2"
          >
            Export
          </button>
          <p className="text-sm text-gray-500">
            {hasUnsavedChanges ? '⚠️ Unsaved changes' : `✓ Last saved: ${formattedTime}`}
          </p>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="bg-gray-100 border-b px-4 py-2 flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Specification (JSON)</span>
          <button
            onClick={handleFormatChange}
            className="text-sm px-2 py-1 text-gray-600 hover:text-gray-900"
            title="Format JSON"
          >
            <IoPencil size={16} />
          </button>
        </div>
        <textarea
          value={editValue}
          onChange={handleChange}
          className="w-full h-96 p-4 font-mono text-sm border-0 focus:outline-none"
          spellCheck="false"
        />
      </div>
    </div>
  )
}

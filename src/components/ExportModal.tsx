import { useState } from 'react'
import { Modal } from './Modal'
import { useSpecStore } from '@/store/specStore'
import { useToast } from './Toast'
import { downloadFile, copyToClipboard, serializeToJSON, serializeToYAML } from '@/utils/openapi'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const { spec } = useSpecStore()
  const { addToast } = useToast()
  const [format, setFormat] = useState<'json' | 'yaml'>('json')

  if (!spec) return null

  const handleDownload = () => {
    try {
      const content = format === 'json' ? serializeToJSON(spec) : serializeToYAML(spec)
      const filename = `${spec.info.title.toLowerCase().replace(/\s+/g, '-')}.${format === 'json' ? 'json' : 'yaml'}`
      downloadFile(content, filename)
      addToast(`Specification exported as ${format.toUpperCase()}`, 'success')
      onClose()
    } catch (err) {
      addToast('Failed to export', 'error')
    }
  }

  const handleCopyToClipboard = async () => {
    try {
      const content = format === 'json' ? serializeToJSON(spec) : serializeToYAML(spec)
      const success = await copyToClipboard(content)
      if (success) {
        addToast(`Copied ${format.toUpperCase()} to clipboard`, 'success')
        onClose()
      } else {
        addToast('Failed to copy to clipboard', 'error')
      }
    } catch (err) {
      addToast('Failed to copy to clipboard', 'error')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export Specification">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                value="json"
                checked={format === 'json'}
                onChange={(e) => setFormat(e.target.value as 'json' | 'yaml')}
                className="mr-2"
              />
              <span className="text-gray-700">JSON</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="yaml"
                checked={format === 'yaml'}
                onChange={(e) => setFormat(e.target.value as 'json' | 'yaml')}
                className="mr-2"
              />
              <span className="text-gray-700">YAML</span>
            </label>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleDownload}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Download
          </button>
          <button
            onClick={handleCopyToClipboard}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Copy to Clipboard
          </button>
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

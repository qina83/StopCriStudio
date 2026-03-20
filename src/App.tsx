import { useEffect, useState } from 'react'
import { useSpecStore } from '@/store/specStore'
import { ToastProvider } from '@/components/Toast'
import { CreateNewModal } from '@/components/CreateNewModal'
import { UploadModal } from '@/components/UploadModal'
import { ExportModal } from '@/components/ExportModal'
import { RecoveryModal } from '@/components/RecoveryModal'
import { Landing } from '@/components/Landing'
import { Editor } from '@/components/Editor'

function AppContent() {
  const { spec, loadDraft, setSpec, clearDraft } = useSpecStore()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showRecoveryModal, setShowRecoveryModal] = useState(false)
  const [draftTime, setDraftTime] = useState('')

  // Check for draft on mount
  useEffect(() => {
    const draft = loadDraft()
    if (draft && !spec) {
      setDraftTime(new Date(draft.timestamp).toLocaleString())
      setShowRecoveryModal(true)
    }
  }, [])

  const handleLoadDraft = () => {
    const draft = loadDraft()
    if (draft) {
      setSpec(draft.spec)
    }
    setShowRecoveryModal(false)
  }

  const handleDiscardDraft = () => {
    clearDraft()
    setShowRecoveryModal(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">OpenAPI Visual Editor</h1>
          {spec && (
            <button
              onClick={() => setShowExportModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Export
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {spec ? (
          <Editor onExport={() => setShowExportModal(true)} />
        ) : (
          <Landing onCreateNew={() => setShowCreateModal(true)} onUpload={() => setShowUploadModal(true)} />
        )}
      </main>

      <CreateNewModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
      <UploadModal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} />
      <ExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} />
      <RecoveryModal
        isOpen={showRecoveryModal}
        onLoadDraft={handleLoadDraft}
        onDiscard={handleDiscardDraft}
        draftTime={draftTime}
      />
    </div>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  )
}

import { Modal } from './Modal'

interface RecoveryModalProps {
  isOpen: boolean
  onLoadDraft: () => void
  onDiscard: () => void
  draftTime: string
}

export function RecoveryModal({
  isOpen,
  onLoadDraft,
  onDiscard,
  draftTime,
}: RecoveryModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={() => {}} title="Recover Unsaved Draft">
      <div className="space-y-4">
        <p className="text-gray-700">
          We found an unsaved draft from <span className="font-semibold">{draftTime}</span>.
        </p>
        <p className="text-gray-600 text-sm">
          Would you like to recover it or start fresh?
        </p>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onDiscard}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Discard & Start New
          </button>
          <button
            onClick={onLoadDraft}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Load Draft
          </button>
        </div>
      </div>
    </Modal>
  )
}

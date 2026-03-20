import { IoAddCircle, IoCloudUpload } from 'react-icons/io5'

interface LandingProps {
  onCreateNew: () => void
  onUpload: () => void
}

export function Landing({ onCreateNew, onUpload }: LandingProps) {
  return (
    <div className="text-center py-12">
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">
        Welcome to the OpenAPI Visual Editor
      </h2>
      <p className="text-gray-600 mb-8">
        Create and edit OpenAPI specifications with an intuitive visual interface.
      </p>

      <div className="space-y-4 inline-block">
        <button
          onClick={onCreateNew}
          className="flex items-center gap-2 px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors w-64"
        >
          <IoAddCircle size={20} />
          Create New API
        </button>

        <button
          onClick={onUpload}
          className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors w-64"
        >
          <IoCloudUpload size={20} />
          Upload Existing File
        </button>
      </div>
    </div>
  )
}

import { X } from 'lucide-react'

interface BulkAutoDispatchBarProps {
  count: number
  onConfirm: () => void
  onCancel: () => void
}

export default function BulkAutoDispatchBar({
  count,
  onConfirm,
  onCancel,
}: BulkAutoDispatchBarProps) {
  return (
    <div className="bg-white border-t border-gray-200 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-700">
          {count} {count === 1 ? 'service' : 'services'} selected
        </span>
        <button
          onClick={onCancel}
          className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          Clear selection
        </button>
      </div>
      <button
        onClick={onConfirm}
        className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
      >
        Auto Dispatch Selected
      </button>
    </div>
  )
}

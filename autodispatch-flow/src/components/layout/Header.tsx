import { Plus, Clock, ChevronDown } from 'lucide-react'

interface HeaderProps {
  onNewRequest?: () => void
}

export default function Header({ onNewRequest }: HeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-gray-900">GeoWise</h1>
      </div>
      <div className="flex items-center gap-4">
        <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
          <Clock className="w-5 h-5" />
          <ChevronDown className="w-4 h-4" />
        </button>
        <button
          onClick={onNewRequest}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Service Request
        </button>
      </div>
    </header>
  )
}

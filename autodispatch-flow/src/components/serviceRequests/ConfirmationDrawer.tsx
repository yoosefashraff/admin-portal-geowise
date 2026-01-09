import { CheckCircle2 } from 'lucide-react'
import Drawer from '../ui/Drawer'
import type { ServiceRequest } from '../../types/serviceRequest'

interface ConfirmationDrawerProps {
  isOpen: boolean
  onClose: () => void
  requests: ServiceRequest[]
  onConfirm: () => void
}

export default function ConfirmationDrawer({
  isOpen,
  onClose,
  requests,
  onConfirm,
}: ConfirmationDrawerProps) {
  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Confirm Auto Dispatch">
      <div className="space-y-6">
        {/* Message */}
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
          <p className="text-sm text-gray-700">
            Once confirmed, GeoWise will automatically dispatch these services when matching providers and time slots are available.
          </p>
        </div>

        {/* Services List */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Selected Services ({requests.length})
          </h3>
          {requests.length === 0 ? (
            <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
              <p className="text-sm text-warning-700">
                No approved services selected. Only services with "Approved" status can be enabled for Auto Dispatch.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{request.name}</div>
                      <div className="text-sm text-gray-600 mt-1">{request.service}</div>
                      <div className="text-sm text-gray-500 mt-1">{request.address}</div>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={requests.length === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm & Activate
          </button>
        </div>
      </div>
    </Drawer>
  )
}

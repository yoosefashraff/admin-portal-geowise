import { MoreVertical, CheckCircle2, Clock, FileText, XCircle } from 'lucide-react'
import type { ServiceRequest } from '../../types/serviceRequest'

interface ServiceRequestRowProps {
  request: ServiceRequest
  onToggleAutoDispatch: (id: string, enabled: boolean) => void
  onToggleSelect: (id: string, selected: boolean) => void
}

export default function ServiceRequestRow({
  request,
  onToggleAutoDispatch,
  onToggleSelect,
}: ServiceRequestRowProps) {
  const isApproved = request.status === 'Approved'
  const canEnableAutoDispatch = isApproved

  const handleToggleChange = (enabled: boolean) => {
    if (!canEnableAutoDispatch && enabled) {
      return
    }
    onToggleAutoDispatch(request.id, enabled)
    onToggleSelect(request.id, enabled)
  }

  const getStatusBadge = () => {
    if (request.autoDispatchEnabled) {
      return (
        <div className="flex flex-col gap-1">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
            <Clock className="w-3.5 h-3.5" />
            Waiting for Auto Dispatch
          </span>
          <p className="text-xs text-gray-500">
            This service will be dispatched automatically when conditions match.
          </p>
        </div>
      )
    }

    switch (request.status) {
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-success-100 text-success-700">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Approved
          </span>
        )
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-warning-100 text-warning-700">
            <Clock className="w-3.5 h-3.5" />
            Pending
          </span>
        )
      case 'Draft':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            <FileText className="w-3.5 h-3.5" />
            Draft
          </span>
        )
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-error-100 text-error-700">
            <XCircle className="w-3.5 h-3.5" />
            Rejected
          </span>
        )
      default:
        return null
    }
  }

  return (
    <tr className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
      request.autoDispatchEnabled ? 'bg-primary-25' : ''
    }`}>
      {/* Checkbox */}
      <td className="px-4 py-4">
        <input
          type="checkbox"
          checked={request.selected || false}
          onChange={(e) => onToggleSelect(request.id, e.target.checked)}
          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
          aria-label={`Select ${request.name}`}
        />
      </td>

      {/* Name */}
      <td className="px-4 py-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="font-medium text-gray-900">{request.name}</div>
            {request.autoDispatchEnabled && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                <Clock className="w-3 h-3" />
                Waiting
              </span>
            )}
          </div>
          <div className="text-sm text-gray-500">{request.phone}</div>
          {request.autoDispatchEnabled && (
            <p className="text-xs text-gray-500 mt-0.5">
              Will be dispatched automatically when conditions match.
            </p>
          )}
        </div>
      </td>

      {/* Service */}
      <td className="px-4 py-4">
        <div className="flex flex-col gap-0.5">
          <div className="font-medium text-gray-900">{request.service}</div>
          <div className="text-sm text-gray-500">{request.address}</div>
        </div>
      </td>

      {/* Credits */}
      <td className="px-4 py-4">
        <div className="flex flex-col gap-0.5 text-sm">
          <div className="text-gray-900">
            {request.credits.approved} Approved credits
          </div>
          <div className="text-gray-600">
            {request.credits.used} Used credits
          </div>
          <div className="text-gray-500">
            {request.credits.remaining} Remaining credits
          </div>
        </div>
      </td>

      {/* Preferred Staff */}
      <td className="px-4 py-4">
        <div className="flex flex-col gap-1">
          {request.preferredStaff.slice(0, 2).map((staff, idx) => (
            <div key={idx} className="text-sm text-gray-900">{staff}</div>
          ))}
          {request.preferredStaff.length > 2 && (
            <div className="text-sm text-gray-500">
              +{request.preferredStaff.length - 2}
            </div>
          )}
        </div>
      </td>

      {/* Preferred Days */}
      <td className="px-4 py-4">
        <div className="text-sm text-gray-900">{request.preferredDays.join(', ')}</div>
      </td>

      {/* Row Actions with Auto Dispatch Toggle */}
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          {/* Auto Dispatch Toggle - visible for Approved services */}
          {isApproved && (
            <div className="flex flex-col items-end gap-1">
              <label className="relative inline-flex items-center cursor-pointer" title={request.autoDispatchEnabled ? "Auto Dispatch Enabled" : "Enable Auto Dispatch"}>
                <input
                  type="checkbox"
                  checked={request.autoDispatchEnabled}
                  onChange={(e) => handleToggleChange(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-success-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-success-600" />
              </label>
              {request.autoDispatchEnabled && (
                <span className="text-xs text-primary-600 font-medium">Auto Dispatch</span>
              )}
            </div>
          )}
          <button className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </td>
    </tr>
  )
}

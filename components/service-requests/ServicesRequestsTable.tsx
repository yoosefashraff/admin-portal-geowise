'use client';

import ActionsDropdown from './ActionsDropdown'
import type { ServiceRequest } from '@/lib/types/serviceRequest.types'

interface ServicesRequestsTableProps {
  requests: ServiceRequest[]
  selectedIds: Set<string>
  onSelect: (id: string, selected: boolean) => void
  onSelectAll: (selected: boolean) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

export default function ServicesRequestsTable({
  requests,
  selectedIds,
  onSelect,
  onSelectAll,
  onEdit,
  onDelete,
}: ServicesRequestsTableProps) {
  const allApprovedSelected = requests
    .filter((r) => r.status === 'Approved')
    .every((r) => selectedIds.has(r.id))
  const hasApprovedServices = requests.some((r) => r.status === 'Approved')

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200/50 w-12">
                <input
                  type="checkbox"
                  checked={hasApprovedServices && allApprovedSelected}
                  onChange={(e) => {
                    e.stopPropagation()
                    onSelectAll(e.target.checked)
                  }}
                  onClick={(e) => e.stopPropagation()}
                  disabled={!hasApprovedServices}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  title={
                    !hasApprovedServices
                      ? 'No approved services available for selection'
                      : allApprovedSelected
                      ? 'Deselect all approved services'
                      : 'Select all approved services'
                  }
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200/50">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200/50">
                Service
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200/50">
                Credits
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {requests.map((request) => {
              const isApproved = request.status === 'Approved'
              const isSelected = selectedIds.has(request.id)
              const isDisabled = !isApproved

              return (
                <tr
                  key={request.id}
                  className={`border-b border-gray-200 transition-colors ${
                    isDisabled ? 'opacity-60' : 'hover:bg-gray-50'
                  }`}
                >
                  {/* Checkbox */}
                  <td className="px-4 py-4 border-r border-gray-200/50" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        e.stopPropagation()
                        if (!isDisabled) {
                          onSelect(request.id, e.target.checked)
                        }
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (isDisabled) {
                          e.preventDefault()
                        }
                      }}
                      disabled={isDisabled}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      title={
                        isDisabled
                          ? `Auto Dispatch is available only for Approved services. Current status: ${request.status}`
                          : 'Select service for Auto Dispatch'
                      }
                      aria-label={`Select ${request.name} for auto dispatch`}
                    />
                  </td>

                  {/* Name */}
                  <td className="px-4 py-4 border-r border-gray-200/50">
                    <div className="flex flex-col gap-0.5">
                      <div className="font-medium text-gray-900">{request.name}</div>
                      <div className="text-sm text-gray-500">{request.phone}</div>
                      {isDisabled && (
                        <div className="text-xs text-gray-400 mt-1">
                          Status: {request.status}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Service */}
                  <td className="px-4 py-4 border-r border-gray-200/50">
                    <div className="flex flex-col gap-0.5">
                      <div className="font-medium text-gray-900">{request.service}</div>
                      <div className="text-sm text-gray-500">{request.address}</div>
                    </div>
                  </td>

                  {/* Credits */}
                  <td className="px-4 py-4 border-r border-gray-200/50">
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

                  {/* Actions */}
                  <td className="px-4 py-4 relative">
                    <div className="absolute top-1/2 -translate-y-1/2 left-4">
                      <ActionsDropdown
                        onEdit={() => onEdit?.(request.id)}
                        onDelete={() => onDelete?.(request.id)}
                      />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

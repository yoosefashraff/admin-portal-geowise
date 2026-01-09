import ActionsDropdown from './ActionsDropdown'
import type { ServiceRequest } from '../../types/serviceRequest'

interface AutoDispatchServicesTableProps {
  requests: ServiceRequest[]
  onDisableAutoDispatch: (id: string) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

export default function AutoDispatchServicesTable({
  requests,
  onDisableAutoDispatch,
  onEdit,
  onDelete,
}: AutoDispatchServicesTableProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Service
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Credits
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {requests.map((request) => (
              <tr
                key={request.id}
                className="border-b border-gray-200 hover:bg-gray-50 transition-colors bg-primary-25"
              >
                {/* Name */}
                <td className="px-4 py-4">
                  <div className="flex flex-col gap-0.5">
                    <div className="font-medium text-gray-900">{request.name}</div>
                    <div className="text-sm text-gray-500">{request.phone}</div>
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

                {/* Actions */}
                <td className="px-4 py-4 relative">
                  <div className="flex flex-col items-start">
                    <button
                      onClick={() => onDisableAutoDispatch(request.id)}
                      className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors mb-2"
                      title="Disable Auto Dispatch"
                    >
                      Disable
                    </button>
                  </div>
                  {/* Three dots centered vertically in the row, aligned with Actions header */}
                  <div className="absolute top-1/2 -translate-y-1/2 left-4">
                    <ActionsDropdown
                      onEdit={() => onEdit?.(request.id)}
                      onDelete={() => onDelete?.(request.id)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

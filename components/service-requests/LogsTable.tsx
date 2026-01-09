'use client';

import type { DispatchLog } from '@/lib/types/dispatchLog.types'
import Link from 'next/link';

interface LogsTableProps {
  logs: DispatchLog[]
  dispatchTypeFilter: 'All' | 'Manual' | 'Auto'
  statusFilter: string
  onDispatchTypeFilterChange: (filter: 'All' | 'Manual' | 'Auto') => void
  onStatusFilterChange: (filter: string) => void
}

export default function LogsTable({
  logs,
  dispatchTypeFilter,
  statusFilter,
  onDispatchTypeFilterChange,
  onStatusFilterChange,
}: LogsTableProps) {
  const getStatusBadge = (status: DispatchLog['dispatchStatus']) => {
    const baseClasses = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium'
    
    switch (status) {
      case 'Dispatched':
        return `${baseClasses} bg-blue-100 text-blue-700`
      case 'In Progress':
        return `${baseClasses} bg-yellow-100 text-yellow-700`
      case 'Failed':
        return `${baseClasses} bg-red-100 text-red-700`
      case 'Completed':
        return `${baseClasses} bg-green-100 text-green-700`
      default:
        return `${baseClasses} bg-gray-100 text-gray-700`
    }
  }

  const getDispatchTypeBadge = (type: DispatchLog['dispatchType']) => {
    const baseClasses = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium'
    
    if (type === 'Auto') {
      return `${baseClasses} bg-green-100 text-green-700`
    }
    return `${baseClasses} bg-gray-100 text-gray-700`
  }

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    if (dispatchTypeFilter !== 'All' && log.dispatchType !== dispatchTypeFilter) {
      return false
    }
    if (statusFilter !== 'All' && log.dispatchStatus !== statusFilter) {
      return false
    }
    return true
  })

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Filters */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-4">
          {/* Dispatch Type Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Dispatch Type:</label>
            <select
              value={dispatchTypeFilter}
              onChange={(e) => onDispatchTypeFilterChange(e.target.value as 'All' | 'Manual' | 'Auto')}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="All">All</option>
              <option value="Manual">Manual</option>
              <option value="Auto">Auto</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="All">All</option>
              <option value="Dispatched">Dispatched</option>
              <option value="In Progress">In Progress</option>
              <option value="Failed">Failed</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Service Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Customer Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Dispatch Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Dispatch Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Date & Time
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Assigned Provider
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Report
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">No logs found</p>
                    <p className="text-xs text-gray-500">
                      {logs.length === 0
                        ? 'No dispatch logs available yet.'
                        : 'No logs match the selected filters.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-4">
                    <div className="text-sm font-medium text-gray-900">{log.serviceName}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-900">{log.customerName}</div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={getDispatchTypeBadge(log.dispatchType)}>
                      {log.dispatchType}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={getStatusBadge(log.dispatchStatus)}>
                      {log.dispatchStatus}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-900">{log.dateTime}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-900">
                      {log.assignedProvider || '—'}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {log.reportId ? (
                      <Link
                        href={`/scheduler/auto-dispatch/report?reportId=${log.reportId}`}
                        className="text-sm text-primary-600 hover:text-primary-700 underline"
                      >
                        View Report
                      </Link>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

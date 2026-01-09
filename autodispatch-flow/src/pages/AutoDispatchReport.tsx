import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Download, ArrowLeft, CheckCircle2, XCircle, FileSpreadsheet } from 'lucide-react'
import Sidebar from '../components/layout/Sidebar'
import Header from '../components/layout/Header'
import type { DispatchReport, DispatchProgressItem } from '../types/dispatchLog'

export default function AutoDispatchReport() {
  const navigate = useNavigate()
  const location = useLocation()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [report, setReport] = useState<DispatchReport | null>(null)

  // Get progress ID from navigation state
  const progressId = (location.state as { progressId?: string })?.progressId

  // TODO: Load report data from API using progressId
  // This endpoint needs to be implemented to fetch dispatch report details
  useEffect(() => {
    if (!progressId) {
      navigate('/service-requests')
      return
    }

    // TODO: Replace with real API call
    // Example: const report = await fetchDispatchReport(progressId)
    // For now, setting null to indicate no data available
    setReport(null)
    
    // Uncomment and implement when API is available:
    // const loadReport = async () => {
    //   try {
    //     const report = await fetchDispatchReport(progressId)
    //     setReport(report)
    //   } catch (error) {
    //     console.error('Failed to load dispatch report:', error)
    //     navigate('/service-requests')
    //   }
    // }
    // loadReport()
  }, [progressId, navigate])

  // Download full report as CSV
  const handleDownloadReport = () => {
    if (!report) return

    const csvRows = [
      ['Service Name', 'Customer Name', 'Status', 'Assigned Provider', 'Completed At', 'Failure Reason'],
      ...report.items.map((item) => [
        item.serviceName,
        item.customerName,
        item.status,
        item.assignedProvider || '—',
        item.completedAt ? new Date(item.completedAt).toLocaleString() : '—',
        item.failureReason || '—',
      ]),
    ]

    const csvContent = csvRows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `auto-dispatch-report-${report.id}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Download failed services only as CSV
  const handleDownloadFailed = () => {
    if (!report) return

    const failedItems = report.items.filter((item) => item.status === 'Failed')
    if (failedItems.length === 0) {
      alert('No failed services to download.')
      return
    }

    const csvRows = [
      ['Service Name', 'Customer Name', 'Failure Reason'],
      ...failedItems.map((item) => [
        item.serviceName,
        item.customerName,
        item.failureReason || 'Unknown error',
      ]),
    ]

    const csvContent = csvRows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `auto-dispatch-failed-${report.id}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (!report) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <div className="flex-1 overflow-y-auto flex items-center justify-center">
            <div className="text-center">
              <div className="text-gray-500 mb-4">No report data available.</div>
              <button
                onClick={() => navigate('/service-requests')}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Back to Service Requests
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const failedItems = report.items.filter((item) => item.status === 'Failed')
  const completedItems = report.items.filter((item) => item.status === 'Completed')

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="mb-6">
              <button
                onClick={() => navigate('/service-requests')}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Services Requests
              </button>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Auto Dispatch Report</h1>
              <p className="text-sm text-gray-600">
                Dispatch completed on {new Date(report.completedAt).toLocaleString()}
              </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="text-sm text-gray-600 mb-1">Total Services</div>
                <div className="text-2xl font-bold text-gray-900">{report.totalCount}</div>
              </div>
              <div className="bg-white rounded-lg border border-success-200 p-4 bg-success-50">
                <div className="text-sm text-success-700 mb-1 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Completed
                </div>
                <div className="text-2xl font-bold text-success-600">{report.completedCount}</div>
              </div>
              <div className="bg-white rounded-lg border border-red-200 p-4 bg-red-50">
                <div className="text-sm text-red-700 mb-1 flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  Failed
                </div>
                <div className="text-2xl font-bold text-red-600">{report.failedCount}</div>
              </div>
            </div>

            {/* Download Actions */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">Download Reports</h3>
                  <p className="text-xs text-gray-600">
                    Export the dispatch results for your records or further analysis.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleDownloadReport}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download Full Report (CSV)
                  </button>
                  {failedItems.length > 0 && (
                    <button
                      onClick={handleDownloadFailed}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      Download Failed Only (CSV)
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Services List */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-6">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Services</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {report.items.map((item) => (
                  <div key={item.serviceId} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {item.status === 'Completed' ? (
                            <CheckCircle2 className="w-5 h-5 text-success-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                          <div>
                            <div className="font-medium text-gray-900">{item.serviceName}</div>
                            <div className="text-sm text-gray-500">{item.customerName}</div>
                          </div>
                        </div>
                        {item.status === 'Failed' && item.failureReason && (
                          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div className="text-sm font-medium text-red-900 mb-1">Failure Reason:</div>
                            <div className="text-sm text-red-700">{item.failureReason}</div>
                            <button
                              className="mt-2 text-xs text-red-700 hover:text-red-900 underline"
                              onClick={() => {
                                // TODO: Implement "Fix now" functionality
                                alert('Fix now functionality to be implemented')
                              }}
                            >
                              Fix now
                            </button>
                          </div>
                        )}
                        {item.status === 'Completed' && item.assignedProvider && (
                          <div className="mt-2 text-sm text-gray-600">
                            Assigned to: <span className="font-medium">{item.assignedProvider}</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                            item.status === 'Completed'
                              ? 'bg-success-100 text-success-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Back to Services Requests CTA */}
            <div className="flex justify-center">
              <button
                onClick={() => navigate('/service-requests')}
                className="px-6 py-3 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Back to Services Requests
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

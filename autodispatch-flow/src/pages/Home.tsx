import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          AutoDispatch Flow
        </h1>
        <p className="text-gray-600 mb-8">
          Front-end application ready for development
        </p>
        <Link
          to="/service-requests"
          className="inline-block px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors shadow-sm"
        >
          View Service Requests
        </Link>
      </div>
    </div>
  )
}

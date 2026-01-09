import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import ServiceRequests from './pages/ServiceRequests'
import AutoDispatchProgress from './pages/AutoDispatchProgress'
import AutoDispatchReport from './pages/AutoDispatchReport'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/service-requests" element={<ServiceRequests />} />
      <Route path="/auto-dispatch/progress" element={<AutoDispatchProgress />} />
      <Route path="/auto-dispatch/report" element={<AutoDispatchReport />} />
    </Routes>
  )
}

export default App

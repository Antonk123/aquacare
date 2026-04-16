import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider, ProtectedRoute } from './contexts/AuthContext'
import { Layout } from './components/Layout'
import Dashboard from './pages/Dashboard'
import Schedule from './pages/Schedule'
import WaterLog from './pages/WaterLog'
import WaterLogForm from './pages/WaterLogForm'
import Calculator from './pages/Calculator'
import Notes from './pages/Notes'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Activity from './pages/Activity'
import More from './pages/More'
import Welcome from './pages/Welcome'
import CreateFacility from './pages/CreateFacility'
import JoinFacility from './pages/JoinFacility'
import Login from './pages/Login'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public auth routes */}
          <Route path="valkom" element={<Welcome />} />
          <Route path="skapa" element={<CreateFacility />} />
          <Route path="join" element={<JoinFacility />} />
          <Route path="login" element={<Login />} />

          {/* Protected app routes */}
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="schema" element={<Schedule />} />
            <Route path="logg" element={<WaterLog />} />
            <Route path="logg/ny" element={<WaterLogForm />} />
            <Route path="logg/redigera/:id" element={<WaterLogForm />} />
            <Route path="mer" element={<More />} />
            <Route path="kalkyl" element={<Calculator />} />
            <Route path="noteringar" element={<Notes />} />
            <Route path="rapporter" element={<Reports />} />
            <Route path="installningar" element={<Settings />} />
            <Route path="aktivitet" element={<Activity />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

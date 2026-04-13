import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import Dashboard from './pages/Dashboard'
import Schedule from './pages/Schedule'
import WaterLog from './pages/WaterLog'
import WaterLogForm from './pages/WaterLogForm'
import Calculator from './pages/Calculator'
import Notes from './pages/Notes'
import Settings from './pages/Settings'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="schema" element={<Schedule />} />
          <Route path="logg" element={<WaterLog />} />
          <Route path="logg/ny" element={<WaterLogForm />} />
          <Route path="logg/redigera/:id" element={<WaterLogForm />} />
          <Route path="kalkyl" element={<Calculator />} />
          <Route path="noteringar" element={<Notes />} />
          <Route path="installningar" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

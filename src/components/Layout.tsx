import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'

export function Layout() {
  return (
    <div className="min-h-dvh max-w-md mx-auto pb-20">
      <Outlet />
      <BottomNav />
    </div>
  )
}

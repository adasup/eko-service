import type { ReactNode } from 'react'
import type { Screen } from '../types'
import BottomNav from './BottomNav'

interface LayoutProps {
  screen: Screen
  onNavigate: (s: Screen) => void
  children: ReactNode
}

const SCREENS_WITH_NAV: Screen[] = ['home', 'dictate', 'settings']

export default function Layout({ screen, onNavigate, children }: LayoutProps) {
  const showNav = SCREENS_WITH_NAV.includes(screen)

  return (
    <div className="min-h-dvh flex flex-col items-center bg-gray-50">
      <div className="w-full max-w-app min-h-dvh bg-white relative flex flex-col">
        <main className={`flex-1 overflow-y-auto ${showNav ? 'pb-20' : ''}`}>
          {children}
        </main>
        {showNav && <BottomNav activeScreen={screen} onNavigate={onNavigate} />}
      </div>
    </div>
  )
}

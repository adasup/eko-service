import { useState } from 'react'
import type { Screen, Budget } from './types'
import { useDatabase } from './hooks/useDatabase'
import Layout from './components/Layout'
import HomeScreen from './components/screens/HomeScreen'
import DictateScreen from './components/screens/DictateScreen'
import ResultScreen from './components/screens/ResultScreen'
import EmailScreen from './components/screens/EmailScreen'
import SettingsScreen from './components/screens/SettingsScreen'

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [activeBudgetId, setActiveBudgetId] = useState<string | null>(null)

  const db = useDatabase()

  const activeBudget = db.budgets.find((b) => b.id === activeBudgetId) ?? null

  function handleOpenBudget(id: string) {
    setActiveBudgetId(id)
    setScreen('result')
  }

  function handleNewBudget() {
    setScreen('dictate')
  }

  async function handleDictateComplete(budget: Budget) {
    await db.saveBudget(budget)
    setActiveBudgetId(budget.id)
    setScreen('result')
  }

  function handleGoEmail() {
    setScreen('email')
  }

  function handleBack() {
    setScreen('home')
    setActiveBudgetId(null)
  }

  function handleBackFromEmail() {
    setScreen('result')
  }

  async function handleBudgetUpdate(b: Budget) {
    await db.saveBudget(b)
    // activeBudget will update via db.budgets re-render
  }

  if (db.loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <svg className="w-8 h-8 animate-spin text-brand-300" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-gray-400">Načítám...</p>
        </div>
      </div>
    )
  }

  if (screen === 'result' && activeBudget) {
    return (
      <div className="min-h-dvh flex flex-col items-center bg-gray-50">
        <div className="w-full max-w-app min-h-dvh bg-white overflow-y-auto">
          <ResultScreen
            key={activeBudgetId}
            budget={activeBudget}
            settings={db.settings}
            onBack={handleBack}
            onEmail={handleGoEmail}
            onBudgetUpdate={handleBudgetUpdate}
          />
        </div>
      </div>
    )
  }

  if (screen === 'email' && activeBudget) {
    return (
      <div className="min-h-dvh flex flex-col items-center bg-gray-50">
        <div className="w-full max-w-app min-h-dvh bg-white overflow-y-auto">
          <EmailScreen
            budget={activeBudget}
            settings={db.settings}
            onBack={handleBackFromEmail}
          />
        </div>
      </div>
    )
  }

  if (screen === 'dictate') {
    return (
      <div className="min-h-dvh flex flex-col items-center bg-gray-50">
        <div className="w-full max-w-app min-h-dvh bg-white relative">
          <DictateScreen
            settings={db.settings}
            priceLists={db.priceLists}
            onDone={handleDictateComplete}
            onBack={handleBack}
          />
        </div>
      </div>
    )
  }

  return (
    <Layout screen={screen} onNavigate={setScreen}>
      {screen === 'home' && (
        <HomeScreen
          budgets={db.budgets}
          onOpen={handleOpenBudget}
          onNew={handleNewBudget}
        />
      )}

      {screen === 'settings' && (
        <SettingsScreen
          settings={db.settings}
          onSave={db.saveSettings}
          priceLists={db.priceLists}
          onUploadPriceList={db.savePriceList}
          onDeletePriceList={db.deletePriceList}
          storageInfo={db.storageInfo}
          onExportData={db.exportData}
          onImportData={db.importData}
          budgetCount={db.budgets.length}
        />
      )}
    </Layout>
  )
}

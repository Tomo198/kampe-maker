import { ErrorBoundary } from '../components/dialogs/ErrorBoundary'
import { EditorLayout } from '../components/layout/EditorLayout'
import { useUIStore } from '../store/uiStore'
import type { AppScreen } from '../store/uiStore'

import { useEffect } from 'react'
import { navigationService } from '../services/navigationService'
import { ProjectListScreen } from '../screens/ProjectListScreen'
import { NewProjectScreen } from '../screens/NewProjectScreen'
import { HelpScreen } from '../screens/HelpScreen'

function AppContent() {
  const currentScreen = useUIStore((s) => s.currentScreen)

  useEffect(() => {
    navigationService.init()
    return () => navigationService.cleanup()
  }, [])

  const renderScreen = (screen: AppScreen) => {
    switch (screen) {
      case 'projectList':
        return <ProjectListScreen />
      case 'newProject':
        return <NewProjectScreen />
      case 'editor':
        return <EditorLayout />
      case 'help':
        return <HelpScreen />
      default:
        return <ProjectListScreen />
    }
  }

  return <div className="app">{renderScreen(currentScreen)}</div>
}



export function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  )
}

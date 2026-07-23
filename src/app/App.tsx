import { ErrorBoundary } from '../components/dialogs/ErrorBoundary'
import { EditorLayout } from '../components/layout/EditorLayout'
import { useUIStore } from '../store/uiStore'
import type { AppScreen } from '../store/uiStore'
import { useProjectStore } from '../store/projectStore'
import { DEFAULT_CANVAS_PRESET } from '../constants/canvas'

function AppContent() {
  const currentScreen = useUIStore((s) => s.currentScreen)

  const renderScreen = (screen: AppScreen) => {
    switch (screen) {
      case 'projectList':
        return <ProjectListPlaceholder />
      case 'newProject':
        return <NewProjectPlaceholder />
      case 'editor':
        return <EditorLayout />
      case 'help':
        return <HelpPlaceholder />
      default:
        return <ProjectListPlaceholder />
    }
  }

  return <div className="app">{renderScreen(currentScreen)}</div>
}

function ProjectListPlaceholder() {
  const setScreen = useUIStore((s) => s.setScreen)
  const initProject = useProjectStore((s) => s.initProject)
  return (
    <div className="placeholder-screen">
      <h1>攻略カンペメーカー</h1>
      <p>プロジェクト一覧（Phase 1で実装）</p>
      <button
        className="placeholder-button"
        onClick={() => {
          // Phase 1 Dummy Initialization
          initProject({
            id: 'default-project',
            name: '名称未設定',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            formatVersion: 1,
            canvas: {
              width: DEFAULT_CANVAS_PRESET.width,
              height: DEFAULT_CANVAS_PRESET.height,
              backgroundColor: '#ffffff',
              transparent: false,
              gridEnabled: false,
              gridSize: 20,
              snapEnabled: false,
            },
            assets: [],
            elements: [],
            groups: [],
          })
          setScreen('editor')
        }}
        aria-label="エディターを開く"
      >
        エディターを開く
      </button>
    </div>
  )
}

function NewProjectPlaceholder() {
  return (
    <div className="placeholder-screen">
      <h1>新規プロジェクト</h1>
      <p>Phase 1で実装</p>
    </div>
  )
}

function HelpPlaceholder() {
  const setScreen = useUIStore((s) => s.setScreen)
  return (
    <div className="placeholder-screen">
      <h1>ヘルプ</h1>
      <p>Phase 4以降で実装</p>
      <button
        className="placeholder-button"
        onClick={() => setScreen('projectList')}
        aria-label="戻る"
      >
        戻る
      </button>
    </div>
  )
}

export function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  )
}

import { useEffect, useState } from 'react'
import { useAutoSave } from '../../features/projects/useAutoSave'
import { db } from '../../db/database'
import { useProjectStore } from '../../store/projectStore'
import { navigationService } from '../../services/navigationService'
import { TopToolbar } from '../toolbar/TopToolbar'
import { Sidebar } from '../sidebar/Sidebar'
import { PropertyPanel } from '../properties/PropertyPanel'
import { CanvasArea } from '../canvas/CanvasArea'
import { MobileNav } from './MobileNav'
import { MobileDrawer } from './MobileDrawer'
import { useUIStore } from '../../store/uiStore'
import { useEditorShortcuts } from '../../features/projects/useEditorShortcuts'
import './EditorLayout.css'

export function EditorLayout() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)
  const propertyPanelOpen = useUIStore((s) => s.propertyPanelOpen)
  const currentProjectId = useUIStore((s) => s.currentProjectId)
  const activeMobilePanel = useUIStore((s) => s.activeMobilePanel)
  const setActiveMobilePanel = useUIStore((s) => s.setActiveMobilePanel)
  const initProject = useProjectStore((s) => s.initProject)

  const { triggerImmediateSave } = useAutoSave()
  const [isLoading, setIsLoading] = useState(true)

  // Initialize editor shortcuts
  useEditorShortcuts()

  useEffect(() => {
    let active = true

    const loadProject = async () => {
      if (!currentProjectId) {
        navigationService.navigate('/projects')
        return
      }

      setIsLoading(true)
      try {
        const record = await db.projects.get(currentProjectId)
        if (!record) throw new Error('Project not found')

        if (active) {
          initProject(
            {
              id: record.id,
              name: record.name,
              createdAt: record.createdAt,
              updatedAt: record.updatedAt,
              formatVersion: record.formatVersion || 1,
              canvas: record.canvas,
              assets: record.assets || [],
              elements: record.elements || [],
              groups: record.groups || [],
            },
            0,
          ) // reset revision to 0

          setIsLoading(false)
        }
      } catch (err) {
        console.error(err)
        alert('プロジェクトの読み込みに失敗しました。')
        if (active) navigationService.navigate('/projects')
      }
    }

    // Save whatever is currently dirty before loading a new one
    triggerImmediateSave()

    loadProject()

    return () => {
      active = false
    }
  }, [currentProjectId, initProject, triggerImmediateSave])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (e.shiftKey) {
          // Trigger .kampe export
          alert('.kampeエクスポートは未実装')
        } else {
          // Trigger manual save
          triggerImmediateSave()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [triggerImmediateSave])

  if (isLoading) {
    return (
      <div
        style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}
      >
        読み込み中...
      </div>
    )
  }

  return (
    <div className="editor-layout">
      <TopToolbar />
      <div className="editor-body">
        {sidebarOpen && (
          <aside className="editor-sidebar" aria-label="サイドバー">
            <Sidebar />
          </aside>
        )}
        <main className="editor-canvas-area" aria-label="キャンバス">
          <CanvasArea />
        </main>
        {propertyPanelOpen && (
          <aside className="editor-property-panel" aria-label="プロパティ">
            <PropertyPanel />
          </aside>
        )}
      </div>
      <MobileNav />

      {/* Mobile Drawers */}
      <MobileDrawer
        isOpen={activeMobilePanel === 'sidebar'}
        onClose={() => setActiveMobilePanel(null)}
        title="ツールと素材"
      >
        <Sidebar />
      </MobileDrawer>

      <MobileDrawer
        isOpen={activeMobilePanel === 'property'}
        onClose={() => setActiveMobilePanel(null)}
        title="プロパティ"
      >
        <PropertyPanel />
      </MobileDrawer>
    </div>
  )
}

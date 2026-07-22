import { TopToolbar } from '../toolbar/TopToolbar'
import { Sidebar } from '../sidebar/Sidebar'
import { PropertyPanel } from '../properties/PropertyPanel'
import { CanvasArea } from '../canvas/CanvasArea'
import { MobileNav } from './MobileNav'
import { useUIStore } from '../../store/uiStore'
import './EditorLayout.css'

export function EditorLayout() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)
  const propertyPanelOpen = useUIStore((s) => s.propertyPanelOpen)

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
    </div>
  )
}

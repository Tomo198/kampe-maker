import { useUIStore } from '../../store/uiStore'
import type { SidebarTab } from '../../store/uiStore'
import './Sidebar.css'

const TABS: { key: SidebarTab; label: string }[] = [
  { key: 'assets', label: '素材' },
  { key: 'text', label: 'テキスト' },
  { key: 'stamps', label: 'スタンプ' },
  { key: 'shapes', label: '図形' },
  { key: 'layers', label: 'レイヤー' },
]

export function Sidebar() {
  const activeTab = useUIStore((s) => s.activeSidebarTab)
  const setTab = useUIStore((s) => s.setSidebarTab)

  return (
    <div className="sidebar">
      <nav className="sidebar-tabs" role="tablist" aria-label="サイドバータブ">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`sidebar-tab ${activeTab === tab.key ? 'sidebar-tab--active' : ''}`}
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => setTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <div className="sidebar-content" role="tabpanel">
        <p className="sidebar-placeholder">Phase 1以降で実装</p>
      </div>
    </div>
  )
}

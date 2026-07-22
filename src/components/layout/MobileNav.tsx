import { useUIStore } from '../../store/uiStore'
import type { SidebarTab } from '../../store/uiStore'
import './MobileNav.css'

const NAV_ITEMS: { key: SidebarTab | 'save'; label: string }[] = [
  { key: 'assets', label: '素材' },
  { key: 'text', label: 'テキスト' },
  { key: 'stamps', label: 'スタンプ' },
  { key: 'layers', label: 'レイヤー' },
  { key: 'save', label: '保存' },
]

export function MobileNav() {
  const activeTab = useUIStore((s) => s.activeSidebarTab)
  const setTab = useUIStore((s) => s.setSidebarTab)

  const handleTap = (key: string) => {
    if (key === 'save') {
      // Phase 4 will implement save
      return
    }
    setTab(key as SidebarTab)
  }

  return (
    <nav className="mobile-nav" aria-label="モバイルナビゲーション">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.key}
          className={`mobile-nav-item ${
            item.key !== 'save' && activeTab === item.key ? 'mobile-nav-item--active' : ''
          }`}
          onClick={() => handleTap(item.key)}
          aria-label={item.label}
        >
          <span className="mobile-nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  )
}

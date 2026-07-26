import { useUIStore } from '../../store/uiStore'
import { useAutoSave } from '../../features/projects/useAutoSave'
import './MobileNav.css'

export function MobileNav() {
  const activeMobilePanel = useUIStore((s) => s.activeMobilePanel)
  const setActiveMobilePanel = useUIStore((s) => s.setActiveMobilePanel)
  const { triggerImmediateSave } = useAutoSave()

  const togglePanel = (panel: 'sidebar' | 'property') => {
    if (activeMobilePanel === panel) {
      setActiveMobilePanel(null)
    } else {
      setActiveMobilePanel(panel)
    }
  }

  return (
    <nav className="mobile-nav" aria-label="モバイルナビゲーション">
      <button
        className={`mobile-nav-item ${activeMobilePanel === 'sidebar' ? 'mobile-nav-item--active' : ''}`}
        onClick={() => togglePanel('sidebar')}
      >
        <span className="mobile-nav-label">ツールと素材</span>
      </button>

      <button
        className={`mobile-nav-item ${activeMobilePanel === 'property' ? 'mobile-nav-item--active' : ''}`}
        onClick={() => togglePanel('property')}
      >
        <span className="mobile-nav-label">プロパティ</span>
      </button>

      <button className="mobile-nav-item" onClick={() => triggerImmediateSave()}>
        <span className="mobile-nav-label">保存</span>
      </button>
    </nav>
  )
}

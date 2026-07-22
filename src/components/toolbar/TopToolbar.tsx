import { useUIStore } from '../../store/uiStore'
import { APP_DISPLAY_NAME } from '../../constants/app'
import './TopToolbar.css'

export function TopToolbar() {
  const setScreen = useUIStore((s) => s.setScreen)
  const saveStatus = useUIStore((s) => s.saveStatus)
  const zoomLevel = useUIStore((s) => s.zoomLevel)

  const saveStatusLabel = (() => {
    switch (saveStatus) {
      case 'saved':
        return '保存済み'
      case 'saving':
        return '保存中...'
      case 'unsaved':
        return '未保存'
      case 'error':
        return '保存失敗'
      case 'capacityWarning':
        return '容量不足'
      default:
        return ''
    }
  })()

  return (
    <header className="top-toolbar" role="toolbar" aria-label="メインツールバー">
      <div className="toolbar-left">
        <button
          className="toolbar-button"
          onClick={() => setScreen('projectList')}
          aria-label="プロジェクト一覧"
          title="プロジェクト一覧"
        >
          ←
        </button>
        <span className="toolbar-app-name">{APP_DISPLAY_NAME}</span>
      </div>

      <div className="toolbar-center">
        {saveStatusLabel && (
          <span className={`toolbar-save-status toolbar-save-status--${saveStatus}`}>
            {saveStatusLabel}
          </span>
        )}
        <span className="toolbar-zoom">{Math.round(zoomLevel * 100)}%</span>
      </div>

      <div className="toolbar-right">
        <button
          className="toolbar-button toolbar-button--export"
          aria-label="画像を保存"
          title="画像を保存"
          disabled
        >
          画像を保存
        </button>
      </div>
    </header>
  )
}

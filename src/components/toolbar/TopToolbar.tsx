import { useUIStore } from '../../store/uiStore'
import { useEditorStore } from '../../store/editorStore'
import { useProjectStore } from '../../store/projectStore'
import { useAutoSave } from '../../features/projects/useAutoSave'
import { exportToPNG } from '../../features/export/exportImage'
import { APP_DISPLAY_NAME } from '../../constants/app'
import './TopToolbar.css'

export function TopToolbar() {
  const setScreen = useUIStore((s) => s.setScreen)
  const saveStatus = useUIStore((s) => s.saveStatus)
  const zoom = useEditorStore((s) => s.zoom)
  const isExporting = useEditorStore((s) => s.isExporting)
  const setIsExporting = useEditorStore((s) => s.setIsExporting)
  const project = useProjectStore((s) => s.project)
  const { triggerImmediateSave } = useAutoSave()

  const handleExport = async () => {
    if (!project || isExporting) return
    setIsExporting(true)
    try {
      await exportToPNG(project)
    } catch (e) {
      console.error(e)
      alert('書き出しに失敗しました。')
    } finally {
      setIsExporting(false)
    }
  }

  const saveStatusLabel = (() => {
    switch (saveStatus) {
      case 'saved':
        return '保存済み'
      case 'saving':
        return '保存中...'
      case 'dirty':
        return '未保存'
      case 'scheduled':
        return '保存待機中'
      case 'error':
        return '保存失敗'
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
        <span style={{ fontSize: '0.85rem', color: '#666', marginRight: '16px' }}>{saveStatusLabel}</span>
        <button className="toolbar-button" onClick={() => triggerImmediateSave()}>
          保存
        </button>
        <span className="toolbar-zoom">{Math.round(zoom * 100)}%</span>
      </div>

      <div className="toolbar-right">
        <button
          className="toolbar-button toolbar-button--export"
          aria-label="画像を保存"
          title="画像を保存"
          onClick={handleExport}
          disabled={!project || isExporting}
        >
          {isExporting ? '保存中...' : '画像を保存'}
        </button>
      </div>
    </header>
  )
}

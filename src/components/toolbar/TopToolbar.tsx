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
  const past = useProjectStore((s) => s.past)
  const future = useProjectStore((s) => s.future)
  const undo = useProjectStore((s) => s.undo)
  const redo = useProjectStore((s) => s.redo)
  const cropMode = useEditorStore((s) => s.cropMode)
  const setCropMode = useEditorStore((s) => s.setCropMode)
  const { triggerImmediateSave } = useAutoSave()

  const handleUndo = () => {
    if (cropMode) return
    undo()
  }

  const handleRedo = () => {
    if (cropMode) return
    redo()
  }

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

  const handleApplyCrop = () => {
    window.dispatchEvent(new CustomEvent('crop-apply'))
  }

  const handleCancelCrop = () => {
    setCropMode(null)
  }

  return (
    <header className="top-toolbar" role="toolbar" aria-label="メインツールバー">
      <div className="toolbar-left">
        <button
          className="toolbar-button"
          onClick={() => setScreen('projectList')}
          aria-label="プロジェクト一覧へ戻る"
          title="プロジェクト一覧へ戻る"
        >
          ←
        </button>

        <div
          className="toolbar-divider"
          style={{
            width: '1px',
            height: '24px',
            backgroundColor: 'var(--color-border)',
            margin: '0 8px',
          }}
        />

        <button
          className="toolbar-button"
          onClick={handleUndo}
          disabled={!project || past.length === 0 || !!cropMode}
          aria-label="元に戻す (Ctrl+Z)"
          title="元に戻す (Ctrl+Z)"
        >
          ⤺
        </button>
        <button
          className="toolbar-button"
          onClick={handleRedo}
          disabled={!project || future.length === 0 || !!cropMode}
          aria-label="やり直す (Ctrl+Shift+Z)"
          title="やり直す (Ctrl+Shift+Z)"
        >
          ⤻
        </button>

        <span className="toolbar-app-name" style={{ marginLeft: '16px' }}>
          {APP_DISPLAY_NAME}
        </span>
      </div>

      <div className="toolbar-center">
        {cropMode ? (
          <>
            <span
              style={{
                fontSize: '0.85rem',
                color: 'var(--color-text-secondary)',
                marginRight: '16px',
                fontWeight: 'bold',
              }}
            >
              トリミング中...
            </span>
            <button
              className="toolbar-button"
              onClick={handleCancelCrop}
              style={{
                borderRadius: '16px',
                padding: '4px 16px',
                marginRight: '8px',
                backgroundColor: 'rgba(50,50,50,0.1)',
              }}
            >
              ✕ キャンセル
            </button>
            <button
              className="toolbar-button"
              onClick={handleApplyCrop}
              style={{
                borderRadius: '16px',
                padding: '4px 16px',
                backgroundColor: 'var(--color-primary)',
                color: 'white',
              }}
            >
              ✓ 適用
            </button>
          </>
        ) : (
          <>
            <span style={{ fontSize: '0.85rem', color: '#666', marginRight: '16px' }}>
              {saveStatusLabel}
            </span>
            <button className="toolbar-button" onClick={() => triggerImmediateSave()}>
              保存
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '16px' }}>
              <span
                className="toolbar-zoom"
                style={{ minWidth: '40px', textAlign: 'right', marginRight: '4px' }}
              >
                {Math.round(zoom * 100)}%
              </span>
              <button
                className="toolbar-button"
                style={{
                  padding: '2px 6px',
                  fontSize: '0.75rem',
                  borderRadius: '4px',
                  minWidth: 'auto',
                }}
                onClick={() => {
                  useEditorStore.getState().setViewportManuallyAdjusted(true)
                  useEditorStore.getState().setZoom(1)
                }}
                title="100%表示"
              >
                100%
              </button>
              <button
                className="toolbar-button"
                style={{
                  padding: '2px 6px',
                  fontSize: '0.75rem',
                  borderRadius: '4px',
                  minWidth: 'auto',
                }}
                onClick={() => window.dispatchEvent(new CustomEvent('editor-auto-fit'))}
                title="全体表示 (Auto-Fit)"
              >
                Fit
              </button>
            </div>
          </>
        )}
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

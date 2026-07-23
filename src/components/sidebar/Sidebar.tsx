import { useUIStore } from '../../store/uiStore'
import type { SidebarTab } from '../../store/uiStore'
import { useProjectStore } from '../../store/projectStore'
import { STAMP_DEFINITIONS } from '../../constants/stamps'
import type { ShapeElement } from '../../models/element'
import { LayersTab } from './LayersTab'
import { AssetsTab } from './AssetsTab'
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
  const project = useProjectStore((s) => s.project)
  const addElement = useProjectStore((s) => s.addElement)

  const handleAddText = () => {
    if (!project) return
    const { width, height } = project.canvas
    addElement({
      id: crypto.randomUUID(),
      type: 'text',
      name: 'テキスト',
      text: 'テキスト',
      fontFamily: 'Noto Sans JP',
      fontSize: 32,
      fontWeight: 400,
      textColor: '#ffffff',
      align: 'center',
      lineHeight: 1.2,
      padding: 8,
      cornerRadius: 0,
      x: width / 2 - 100,
      y: height / 2 - 20,
      width: 200,
      height: 40,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
    })
  }

  const handleAddStamp = (stampId: string) => {
    if (!project) return
    const def = STAMP_DEFINITIONS.find((d) => d.id === stampId)
    if (!def) return
    const { width, height } = project.canvas
    addElement({
      id: crypto.randomUUID(),
      type: 'stamp',
      name: def.label,
      stampId: def.id,
      text: def.defaultText,
      textColor: def.defaultStyle.textColor,
      backgroundColor: def.defaultStyle.backgroundColor,
      borderColor: def.defaultStyle.borderColor,
      cornerRadius: 8,
      x: width / 2 - 40,
      y: height / 2 - 40,
      width: 80,
      height: 80,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
    })
  }

  const handleAddShape = (shapeType: 'rectangle' | 'ellipse' | 'line' | 'arrow') => {
    if (!project) return
    const { width, height } = project.canvas

    const base = {
      id: crypto.randomUUID(),
      type: 'shape' as const,
      name:
        shapeType === 'rectangle'
          ? '四角形'
          : shapeType === 'ellipse'
            ? '円形'
            : shapeType === 'line'
              ? '直線'
              : '矢印',
      x: width / 2 - 50,
      y: height / 2 - 50,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
    }

    if (shapeType === 'rectangle' || shapeType === 'ellipse') {
      addElement({
        ...base,
        shapeType,
        width: 100,
        height: 100,
        strokeColor: '#f44336',
        strokeWidth: 4,
      } as ShapeElement)
    } else {
      addElement({
        ...base,
        shapeType,
        points: [0, 0, 100, 100],
        strokeColor: '#f44336',
        strokeWidth: 4,
      } as ShapeElement)
    }
  }

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
      <div className="sidebar-content" role="tabpanel" style={{ overflowY: 'auto' }}>
        {activeTab === 'assets' && <AssetsTab />}

        {activeTab === 'text' && (
          <div>
            <button
              style={{
                width: '100%',
                padding: '8px',
                cursor: 'pointer',
                background: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
              onClick={handleAddText}
            >
              テキストを追加
            </button>
          </div>
        )}

        {activeTab === 'stamps' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {STAMP_DEFINITIONS.map((def) => (
              <button
                key={def.id}
                style={{
                  padding: '8px',
                  cursor: 'pointer',
                  background: def.defaultStyle.backgroundColor,
                  color: def.defaultStyle.textColor,
                  border: 'none',
                  borderRadius: '4px',
                  fontWeight: 'bold',
                }}
                onClick={() => handleAddStamp(def.id)}
              >
                {def.label}
              </button>
            ))}
          </div>
        )}

        {activeTab === 'shapes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              style={{
                padding: '8px',
                cursor: 'pointer',
                background: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
              onClick={() => handleAddShape('arrow')}
            >
              矢印を追加
            </button>
            <button
              style={{
                padding: '8px',
                cursor: 'pointer',
                background: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
              onClick={() => handleAddShape('rectangle')}
            >
              四角形を追加
            </button>
            <button
              style={{
                padding: '8px',
                cursor: 'pointer',
                background: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
              onClick={() => handleAddShape('ellipse')}
            >
              円形を追加
            </button>
            <button
              style={{
                padding: '8px',
                cursor: 'pointer',
                background: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
              onClick={() => handleAddShape('line')}
            >
              直線を追加
            </button>
          </div>
        )}

        {activeTab === 'layers' && <LayersTab />}
      </div>
    </div>
  )
}

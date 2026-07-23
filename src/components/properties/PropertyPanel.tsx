import React, { useState } from 'react'
import './PropertyPanel.css'
import { useEditorStore } from '../../store/editorStore'
import { useProjectStore } from '../../store/projectStore'
import type {
  TextElement,
  StampElement,
  ShapeElement,
  BoxShapeElement,
  CanvasElement,
} from '../../models/element'
import { calculateAlignment, getBoundingBox } from '../../utils/alignment'
import type { AlignAction } from '../../utils/alignment'

// Helper for debounced/blur-based input
const TextInput: React.FC<{
  value: string
  label: string
  onChange: (val: string) => void
  multiline?: boolean
}> = ({ value, label, onChange, multiline }) => {
  const [local, setLocal] = useState(value)
  const [prev, setPrev] = useState(value)
  if (value !== prev) {
    setLocal(value)
    setPrev(value)
  }

  const handleCommit = () => {
    if (local !== value) onChange(local)
  }

  return (
    <div className="property-panel-group">
      <label>{label}</label>
      {multiline ? (
        <textarea
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          onBlur={handleCommit}
          className="property-input"
          rows={3}
        />
      ) : (
        <input
          type="text"
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          onBlur={handleCommit}
          onKeyDown={(e) => e.key === 'Enter' && handleCommit()}
          className="property-input"
        />
      )}
    </div>
  )
}

const NumberInput: React.FC<{ value: number; label: string; onChange: (val: number) => void }> = ({
  value,
  label,
  onChange,
}) => {
  const [local, setLocal] = useState(value.toString())
  const [prev, setPrev] = useState(value)
  if (value !== prev) {
    setLocal(value.toString())
    setPrev(value)
  }

  const handleCommit = () => {
    const num = parseFloat(local)
    if (!isNaN(num) && num !== value) onChange(num)
  }

  return (
    <div className="property-panel-group">
      <label>{label}</label>
      <input
        type="number"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={handleCommit}
        onKeyDown={(e) => e.key === 'Enter' && handleCommit()}
        className="property-input"
      />
    </div>
  )
}

const ColorInput: React.FC<{ value: string; label: string; onChange: (val: string) => void }> = ({
  value,
  label,
  onChange,
}) => {
  const [local, setLocal] = useState(value)
  const [prev, setPrev] = useState(value)
  if (value !== prev) {
    setLocal(value)
    setPrev(value)
  }

  const handleCommit = () => {
    if (local !== value) onChange(local)
  }

  return (
    <div
      className="property-panel-group"
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
    >
      <label>{label}</label>
      <input
        type="color"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={handleCommit}
        className="property-input-color"
      />
    </div>
  )
}

export function PropertyPanel() {
  const selectedRefs = useEditorStore((s) => s.selectedElements)
  const setCropMode = useEditorStore((s) => s.setCropMode)
  const setSelectedElements = useEditorStore((s) => s.setSelectedElements)
  const project = useProjectStore((s) => s.project)
  const updateElement = useProjectStore((s) => s.updateElement)
  const updateElements = useProjectStore((s) => s.updateElements)
  const groupElements = useProjectStore((s) => s.groupElements)
  const ungroupElements = useProjectStore((s) => s.ungroupElements)

  if (!project) return null

  if (selectedRefs.length === 0) {
    return (
      <div className="property-panel">
        <div className="property-panel-header">
          <h2 className="property-panel-title">プロパティ</h2>
        </div>
        <div className="property-panel-content">
          <p className="property-panel-placeholder">要素を選択してください</p>
        </div>
      </div>
    )
  }

  const handleAlign = (action: AlignAction) => {
    if (!project) return
    const units = selectedRefs
      .map((ref) => {
        const elements =
          ref.type === 'group'
            ? project.elements.filter((el) => el.groupId === ref.id)
            : project.elements.filter((el) => el.id === ref.id)
        return {
          id: ref.id,
          isGroup: ref.type === 'group',
          elements,
          bbox: getBoundingBox(elements),
        }
      })
      .filter((u) => u.elements.length > 0)

    const alignments = calculateAlignment(
      units,
      action,
      project.canvas.width,
      project.canvas.height,
    )

    const updates: { id: string; updates: Partial<CanvasElement> }[] = []

    for (const align of alignments) {
      if (align.isGroup) {
        const groupElements = project.elements.filter((el) => el.groupId === align.id)
        for (const el of groupElements) {
          updates.push({ id: el.id, updates: { x: el.x + align.dx, y: el.y + align.dy } })
        }
      } else {
        const p: Partial<CanvasElement> = {
          x: project.elements.find((e) => e.id === align.id)!.x + align.dx,
          y: project.elements.find((e) => e.id === align.id)!.y + align.dy,
        }
        if (align.newWidth !== undefined) Object.assign(p, { width: align.newWidth })
        if (align.newHeight !== undefined) Object.assign(p, { height: align.newHeight })
        updates.push({ id: align.id, updates: p })
      }
    }

    if (updates.length > 0) {
      updateElements(updates)
    }
  }

  const handleGroup = () => {
    if (selectedRefs.length < 2) return
    const allElements = selectedRefs.every((r) => r.type === 'element')
    if (!allElements) {
      alert('既存のグループが含まれています。先にグループを解除してください。')
      return
    }
    const ids = selectedRefs.map((r) => r.id)
    groupElements(ids)
    setSelectedElements([])
  }

  const handleUngroup = () => {
    for (const ref of selectedRefs) {
      if (ref.type === 'group') {
        ungroupElements(ref.id)
      }
    }
    setSelectedElements([])
  }

  if (selectedRefs.length > 1 || (selectedRefs.length === 1 && selectedRefs[0].type === 'group')) {
    const isSingleGroup = selectedRefs.length === 1 && selectedRefs[0].type === 'group'
    const containsGroup = selectedRefs.some((r) => r.type === 'group')
    return (
      <div className="property-panel">
        <div className="property-panel-header">
          <h2 className="property-panel-title">
            {isSingleGroup ? 'グループプロパティ' : '複数選択'}
          </h2>
        </div>
        <div className="property-panel-content">
          <div className="property-panel-controls">
            {!containsGroup && selectedRefs.length >= 2 && (
              <button
                className="property-btn-primary"
                onClick={handleGroup}
                style={{ marginBottom: '16px' }}
              >
                グループ化
              </button>
            )}

            {containsGroup && (
              <button
                className="property-btn-primary"
                onClick={handleUngroup}
                style={{ marginBottom: '16px', background: 'var(--color-bg-hover)' }}
              >
                グループ解除
              </button>
            )}

            <div className="property-panel-group">
              <label>整列</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' }}>
                <button title="左揃え" onClick={() => handleAlign('left')}>
                  左
                </button>
                <button title="中央揃え" onClick={() => handleAlign('center')}>
                  中
                </button>
                <button title="右揃え" onClick={() => handleAlign('right')}>
                  右
                </button>
                <button title="上揃え" onClick={() => handleAlign('top')}>
                  上
                </button>
                <button title="縦中央揃え" onClick={() => handleAlign('middle')}>
                  中
                </button>
                <button title="下揃え" onClick={() => handleAlign('bottom')}>
                  下
                </button>
              </div>
            </div>

            {selectedRefs.length >= 3 && (
              <div className="property-panel-group">
                <label>均等配置</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                  <button title="横方向に均等に配置" onClick={() => handleAlign('distribute-x')}>
                    横
                  </button>
                  <button title="縦方向に均等に配置" onClick={() => handleAlign('distribute-y')}>
                    縦
                  </button>
                </div>
              </div>
            )}

            {!containsGroup && selectedRefs.length >= 2 && (
              <div className="property-panel-group">
                <label>サイズ合わせ</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                  <button onClick={() => handleAlign('match-width')}>幅を合わせる</button>
                  <button onClick={() => handleAlign('match-height')}>高さを合わせる</button>
                </div>
              </div>
            )}

            <div className="property-panel-group">
              <label>キャンバス基準</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '4px' }}>
                <button onClick={() => handleAlign('center-to-canvas')}>キャンバス中央へ</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Single element selected
  const ref = selectedRefs[0]
  if (ref.type !== 'element') return null

  const selectedElement = project.elements.find((el) => el.id === ref.id)
  if (!selectedElement) return null

  const handleUpdate = (updates: Partial<CanvasElement>) => {
    updateElement(selectedElement.id, updates as Partial<CanvasElement>)
  }

  return (
    <div className="property-panel">
      <div className="property-panel-header">
        <h2 className="property-panel-title">プロパティ</h2>
      </div>
      <div className="property-panel-content">
        <div className="property-panel-controls">
          <div className="property-panel-group" style={{ marginBottom: '16px' }}>
            <label style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>
              種類: {selectedElement.type}
            </label>
          </div>

          <NumberInput
            label="X"
            value={Math.round(selectedElement.x)}
            onChange={(v) => handleUpdate({ x: v })}
          />
          <NumberInput
            label="Y"
            value={Math.round(selectedElement.y)}
            onChange={(v) => handleUpdate({ y: v })}
          />
          <NumberInput
            label="透明度 (0-1)"
            value={selectedElement.opacity}
            onChange={(v) => handleUpdate({ opacity: v })}
          />

          {selectedElement.type === 'image' && (
            <div className="property-panel-group" style={{ marginTop: '16px' }}>
              <button
                className="property-btn-primary"
                onClick={() => setCropMode({ elementId: selectedElement.id })}
              >
                トリミングを開始
              </button>
            </div>
          )}

          {selectedElement.type === 'text' && (
            <>
              <TextInput
                label="テキスト"
                value={(selectedElement as TextElement).text}
                onChange={(v) => handleUpdate({ text: v })}
                multiline
              />
              <NumberInput
                label="フォントサイズ"
                value={(selectedElement as TextElement).fontSize}
                onChange={(v) => handleUpdate({ fontSize: v })}
              />
              <ColorInput
                label="文字色"
                value={(selectedElement as TextElement).textColor}
                onChange={(v) => handleUpdate({ textColor: v })}
              />
              <ColorInput
                label="背景色"
                value={(selectedElement as TextElement).backgroundColor || '#00000000'}
                onChange={(v) => handleUpdate({ backgroundColor: v })}
              />
              <div className="property-panel-group">
                <label>太字</label>
                <input
                  type="checkbox"
                  checked={(selectedElement as TextElement).fontWeight === 700}
                  onChange={(e) => handleUpdate({ fontWeight: e.target.checked ? 700 : 400 })}
                />
              </div>
            </>
          )}

          {selectedElement.type === 'stamp' && (
            <>
              <TextInput
                label="テキスト"
                value={(selectedElement as StampElement).text || ''}
                onChange={(v) => handleUpdate({ text: v })}
              />
              <ColorInput
                label="文字色"
                value={(selectedElement as StampElement).textColor}
                onChange={(v) => handleUpdate({ textColor: v })}
              />
              <ColorInput
                label="背景色"
                value={(selectedElement as StampElement).backgroundColor}
                onChange={(v) => handleUpdate({ backgroundColor: v })}
              />
            </>
          )}

          {selectedElement.type === 'shape' && (
            <>
              <ColorInput
                label="線の色"
                value={(selectedElement as ShapeElement).strokeColor}
                onChange={(v) => handleUpdate({ strokeColor: v })}
              />
              <NumberInput
                label="線の太さ"
                value={(selectedElement as ShapeElement).strokeWidth}
                onChange={(v) => handleUpdate({ strokeWidth: v })}
              />
              {((selectedElement as ShapeElement).shapeType === 'rectangle' ||
                (selectedElement as ShapeElement).shapeType === 'ellipse') && (
                <ColorInput
                  label="塗りつぶし色"
                  value={(selectedElement as unknown as BoxShapeElement).fillColor || '#00000000'}
                  onChange={(v) => handleUpdate({ fillColor: v })}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

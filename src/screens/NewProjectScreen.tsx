import { useState } from 'react'
import { navigationService } from '../services/navigationService'
import {
  CANVAS_PRESETS,
  CANVAS_MAX_SIZE,
  CANVAS_MIN_SIZE,
  DEFAULT_CANVAS_PRESET,
} from '../constants/canvas'
import { db } from '../db/database'
import { useProjectStore } from '../store/projectStore'
import type { ProjectRecord } from '../db/types'
import './Screens.css'

export function NewProjectScreen() {
  const initProject = useProjectStore((s) => s.initProject)

  const [name, setName] = useState('')
  const [presetLabel, setPresetLabel] = useState(DEFAULT_CANVAS_PRESET.label)
  const [width, setWidth] = useState(DEFAULT_CANVAS_PRESET.width.toString())
  const [height, setHeight] = useState(DEFAULT_CANVAS_PRESET.height.toString())
  const [backgroundColor, setBackgroundColor] = useState('#ffffff')
  const [transparent, setTransparent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const label = e.target.value
    setPresetLabel(label)
    if (label !== 'custom') {
      const preset = CANVAS_PRESETS.find((p) => p.label === label)
      if (preset) {
        setWidth(preset.width.toString())
        setHeight(preset.height.toString())
      }
    }
  }

  const selectPresetDirectly = (label: string, w: number, h: number) => {
    setPresetLabel(label)
    setWidth(w.toString())
    setHeight(h.toString())
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    const trimmedName = name.trim() || '無題のカンペ'
    if (trimmedName.length > 100) {
      setError('プロジェクト名は100文字以内で入力してください。')
      return
    }

    const w = parseInt(width, 10)
    const h = parseInt(height, 10)

    if (isNaN(w) || w < CANVAS_MIN_SIZE || w > CANVAS_MAX_SIZE) {
      setError(`幅は ${CANVAS_MIN_SIZE}px から ${CANVAS_MAX_SIZE}px の間で指定してください。`)
      return
    }

    if (isNaN(h) || h < CANVAS_MIN_SIZE || h > CANVAS_MAX_SIZE) {
      setError(`高さは ${CANVAS_MIN_SIZE}px から ${CANVAS_MAX_SIZE}px の間で指定してください。`)
      return
    }

    setIsSubmitting(true)
    try {
      const now = new Date().toISOString()
      const newProject: ProjectRecord = {
        id: crypto.randomUUID(),
        name: trimmedName,
        createdAt: now,
        updatedAt: now,
        formatVersion: 1,
        canvas: {
          width: w,
          height: h,
          backgroundColor,
          transparent,
          gridEnabled: false,
          gridSize: 20,
          snapEnabled: true,
        },
        assets: [],
        elements: [],
        groups: [],
      }

      await db.projects.put(newProject)

      // Initialize store
      initProject(newProject, 0)

      // Navigate to editor
      navigationService.navigate(`/projects/${newProject.id}`)
    } catch (err) {
      console.error('Failed to create project', err)
      setError('プロジェクトの作成に失敗しました。')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="screen-container">
      <header className="screen-header">
        <h1>新規プロジェクト作成</h1>
        <button
          className="button-secondary"
          onClick={() => window.history.back()}
          disabled={isSubmitting}
        >
          キャンセル
        </button>
      </header>

      <main className="screen-content">
        <div className="form-card">
          <form onSubmit={handleSubmit}>
            {error && (
              <div
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  color: 'var(--color-accent-danger)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '24px',
                  fontSize: '0.9rem',
                }}
              >
                ⚠️ {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="projectName">プロジェクト名</label>
              <input
                id="projectName"
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="無題のカンペ"
                maxLength={100}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="canvasPreset">キャンバスサイズ (プリセット)</label>
              <div className="preset-grid" style={{ marginBottom: '12px' }}>
                {CANVAS_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    className={`preset-chip ${presetLabel === p.label ? 'preset-chip--active' : ''}`}
                    onClick={() => selectPresetDirectly(p.label, p.width, p.height)}
                  >
                    <div>{p.label}</div>
                    <div style={{ fontSize: '0.725rem', opacity: 0.8 }}>
                      {p.width} × {p.height}
                    </div>
                  </button>
                ))}
              </div>
              <select
                id="canvasPreset"
                className="form-select"
                value={presetLabel}
                onChange={handlePresetChange}
              >
                {CANVAS_PRESETS.map((p) => (
                  <option key={p.label} value={p.label}>
                    {p.label} ({p.width} × {p.height})
                  </option>
                ))}
                <option value="custom">カスタムサイズ指定</option>
              </select>
            </div>

            <div className="form-group">
              <label>カスタムサイズ (px)</label>
              <div className="form-row">
                <label
                  style={{ margin: 0, fontWeight: 'normal', color: 'var(--color-text-secondary)' }}
                >
                  幅
                </label>
                <input
                  type="number"
                  className="form-input"
                  value={width}
                  onChange={(e) => {
                    setWidth(e.target.value)
                    setPresetLabel('custom')
                  }}
                  min={CANVAS_MIN_SIZE}
                  max={CANVAS_MAX_SIZE}
                />
                <label
                  style={{ margin: 0, fontWeight: 'normal', color: 'var(--color-text-secondary)' }}
                >
                  高さ
                </label>
                <input
                  type="number"
                  className="form-input"
                  value={height}
                  onChange={(e) => {
                    setHeight(e.target.value)
                    setPresetLabel('custom')
                  }}
                  min={CANVAS_MIN_SIZE}
                  max={CANVAS_MAX_SIZE}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="bgColor">背景設定</label>
              <div className="color-picker-wrapper">
                <input
                  id="bgColor"
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  title="背景色を選択"
                />
                <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                  {backgroundColor}
                </span>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: 'normal',
                    fontSize: '0.9rem',
                    margin: 0,
                    cursor: 'pointer',
                    marginLeft: 'auto',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={transparent}
                    onChange={(e) => setTransparent(e.target.checked)}
                    style={{
                      width: '16px',
                      height: '16px',
                      accentColor: 'var(--color-accent-primary)',
                    }}
                  />
                  透明な背景 (PNG出力時)
                </label>
              </div>
            </div>

            <div style={{ marginTop: '36px', textAlign: 'right' }}>
              <button
                type="submit"
                className="button-primary"
                style={{ padding: '10px 24px', fontSize: '1rem' }}
                disabled={isSubmitting}
              >
                {isSubmitting ? '作成中...' : '🚀 キャンバスを作成'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}

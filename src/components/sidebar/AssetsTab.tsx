import React, { useState, useMemo } from 'react'
import { useProjectStore } from '../../store/projectStore'
import { useEditorStore } from '../../store/editorStore'
import { useImageImport } from '../../features/assets/useImageImport'

export function AssetsTab() {
  const project = useProjectStore((s) => s.project)
  const addElement = useProjectStore((s) => s.addElement)
  const deleteAsset = useProjectStore((s) => s.deleteAsset)
  const setCropMode = useEditorStore((s) => s.setCropMode)
  const { handleFileSelect } = useImageImport()

  const [filter, setFilter] = useState<'all' | 'used' | 'unused'>('all')

  // Calculate usage counts
  const usageCounts = useMemo(() => {
    if (!project) return {}
    const counts: Record<string, number> = {}
    for (const el of project.elements) {
      if (el.type === 'image') {
        counts[el.assetId] = (counts[el.assetId] || 0) + 1
      }
    }
    return counts
  }, [project])

  if (!project) return null

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0])
    }
    e.target.value = ''
  }

  const filteredAssets = project.assets.filter((a) => {
    const isUsed = (usageCounts[a.id] || 0) > 0
    if (filter === 'used') return isUsed
    if (filter === 'unused') return !isUsed
    return true
  })

  const handleAddToCanvas = (assetId: string) => {
    const asset = project.assets.find((a) => a.id === assetId)
    if (!asset) return
    const { width, height } = project.canvas

    // Maintain aspect ratio, fit within half the canvas
    const scale = Math.min(1, width / 2 / asset.width, height / 2 / asset.height)
    const elWidth = asset.width * scale
    const elHeight = asset.height * scale

    addElement({
      id: crypto.randomUUID(),
      type: 'image',
      name: asset.name || '画像',
      assetId: asset.id,
      crop: { x: 0, y: 0, width: 1, height: 1 },
      cornerRadius: 0,
      x: width / 2 - elWidth / 2,
      y: height / 2 - elHeight / 2,
      width: elWidth,
      height: elHeight,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
    })
  }

  const handleCropAndAdd = (assetId: string) => {
    const asset = project.assets.find((a) => a.id === assetId)
    if (!asset) return
    const { width, height } = project.canvas

    const scale = Math.min(1, width / 2 / asset.width, height / 2 / asset.height)
    const elWidth = asset.width * scale
    const elHeight = asset.height * scale

    const id = crypto.randomUUID()
    addElement({
      id,
      type: 'image',
      name: asset.name || '画像',
      assetId: asset.id,
      crop: { x: 0, y: 0, width: 1, height: 1 },
      cornerRadius: 0,
      x: width / 2 - elWidth / 2,
      y: height / 2 - elHeight / 2,
      width: elWidth,
      height: elHeight,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
    })
    setCropMode({ elementId: id })
  }

  const handleDelete = (assetId: string) => {
    const usageCount = usageCounts[assetId] || 0
    if (usageCount > 0) {
      if (
        confirm(
          `この素材はキャンバス上で ${usageCount} 回使用されています。\n関連する配置要素もすべて削除しますか？`,
        )
      ) {
        deleteAsset(assetId, true)
      }
    } else {
      deleteAsset(assetId, false)
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <label
        className="sidebar-upload-btn"
        style={{
          cursor: 'pointer',
          padding: '8px',
          background: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border)',
          display: 'block',
          textAlign: 'center',
          borderRadius: '4px',
        }}
      >
        画像を追加
        <input
          type="file"
          accept="image/png, image/jpeg, image/webp"
          style={{ display: 'none' }}
          onChange={onFileChange}
        />
      </label>

      <div style={{ display: 'flex', gap: '4px' }}>
        <button
          onClick={() => setFilter('all')}
          style={{
            flex: 1,
            padding: '4px',
            fontSize: '12px',
            background:
              filter === 'all' ? 'var(--color-accent-primary)' : 'var(--color-bg-surface)',
            border: '1px solid var(--color-border)',
            color: filter === 'all' ? '#fff' : 'inherit',
            cursor: 'pointer',
            borderRadius: '4px',
          }}
        >
          すべて
        </button>
        <button
          onClick={() => setFilter('used')}
          style={{
            flex: 1,
            padding: '4px',
            fontSize: '12px',
            background:
              filter === 'used' ? 'var(--color-accent-primary)' : 'var(--color-bg-surface)',
            border: '1px solid var(--color-border)',
            color: filter === 'used' ? '#fff' : 'inherit',
            cursor: 'pointer',
            borderRadius: '4px',
          }}
        >
          使用中
        </button>
        <button
          onClick={() => setFilter('unused')}
          style={{
            flex: 1,
            padding: '4px',
            fontSize: '12px',
            background:
              filter === 'unused' ? 'var(--color-accent-primary)' : 'var(--color-bg-surface)',
            border: '1px solid var(--color-border)',
            color: filter === 'unused' ? '#fff' : 'inherit',
            cursor: 'pointer',
            borderRadius: '4px',
          }}
        >
          未使用
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filteredAssets.length === 0 && (
          <p className="sidebar-placeholder" style={{ marginTop: '16px' }}>
            素材がありません
          </p>
        )}

        {filteredAssets.map((asset) => {
          const usedCount = usageCounts[asset.id] || 0
          return (
            <div
              key={asset.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                background: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '4px',
                padding: '8px',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', gap: '8px' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    background: 'var(--color-bg-canvas-outer)',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  <span style={{ fontSize: '24px' }}>🖼️</span>
                </div>
                <div
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '14px',
                        fontWeight: 'bold',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                      }}
                      title={asset.name}
                    >
                      {asset.name}
                    </span>
                    <button
                      onClick={() => handleDelete(asset.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '14px',
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                    {asset.width}x{asset.height} • {formatSize(asset.sizeBytes)}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', marginTop: 'auto' }}>
                    {usedCount > 0 ? (
                      <span
                        style={{
                          fontSize: '10px',
                          background: 'var(--color-accent-success)',
                          color: '#000',
                          padding: '2px 4px',
                          borderRadius: '4px',
                          fontWeight: 'bold',
                        }}
                      >
                        使用中 ({usedCount})
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: '10px',
                          background: 'var(--color-bg-canvas-outer)',
                          color: 'var(--color-text-muted)',
                          padding: '2px 4px',
                          borderRadius: '4px',
                        }}
                      >
                        未使用
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={() => handleAddToCanvas(asset.id)}
                  style={{
                    flex: 1,
                    padding: '4px',
                    fontSize: '12px',
                    background: 'var(--color-bg-hover)',
                    border: '1px solid var(--color-border)',
                    cursor: 'pointer',
                    color: 'var(--color-text-primary)',
                    borderRadius: '4px',
                  }}
                >
                  追加
                </button>
                <button
                  onClick={() => handleCropAndAdd(asset.id)}
                  style={{
                    flex: 1,
                    padding: '4px',
                    fontSize: '12px',
                    background: 'var(--color-bg-hover)',
                    border: '1px solid var(--color-border)',
                    cursor: 'pointer',
                    color: 'var(--color-text-primary)',
                    borderRadius: '4px',
                  }}
                >
                  切り抜き追加
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

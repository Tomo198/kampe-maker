import { useEffect, useState } from 'react'
import { navigationService } from '../services/navigationService'
import { db } from '../db/database'
import type { ProjectRecord } from '../db/types'
import { deleteProject, duplicateProject, renameProject } from '../features/projects/projectManager'
import { APP_DISPLAY_NAME } from '../constants/app'
import './Screens.css'

export function ProjectListScreen() {
  const [projects, setProjects] = useState<ProjectRecord[]>([])
  const [previews, setPreviews] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)

  const loadProjects = async () => {
    try {
      const allProjects = await db.projects.orderBy('updatedAt').reverse().toArray()
      setProjects(allProjects)

      const allPreviews = await db.projectPreviews.toArray()
      const previewMap: Record<string, string> = {}
      for (const p of allPreviews) {
        previewMap[p.projectId] = URL.createObjectURL(p.blob)
      }
      setPreviews(previewMap)
    } catch (err) {
      console.error('Failed to load projects', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProjects()
    return () => {
      // Cleanup object URLs
      Object.values(previews).forEach((url) => URL.revokeObjectURL(url))
    }
  }, [previews])

  const handleCreateNew = () => {
    navigationService.navigate('/projects/new')
  }

  const handleOpen = (id: string) => {
    navigationService.navigate(`/projects/${id}`)
  }

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`「${name}」を削除してもよろしいですか？\nこの操作は取り消せません。`)) {
      await deleteProject(id)
      await loadProjects()
    }
  }

  const handleDuplicate = async (id: string, name: string) => {
    try {
      await duplicateProject(id, `${name} のコピー`)
      await loadProjects()
    } catch (err) {
      console.error(err)
      alert('複製の作成に失敗しました。')
    }
  }

  const handleRename = async (id: string, oldName: string) => {
    const newName = prompt('新しいプロジェクト名を入力してください', oldName)
    if (newName !== null && newName.trim() !== '') {
      await renameProject(id, newName)
      await loadProjects()
    }
  }

  return (
    <div className="screen-container">
      <div className="screen-header">
        <h1>{APP_DISPLAY_NAME}</h1>
        <div>
          <button
            className="button-secondary"
            onClick={() => navigationService.navigate('/help')}
            style={{ marginRight: '16px' }}
          >
            ヘルプ
          </button>
          <button className="button-primary" onClick={handleCreateNew}>
            ＋ 新規プロジェクト
          </button>
        </div>
      </div>

      <div className="screen-content">
        {isLoading ? (
          <p>読み込み中...</p>
        ) : projects.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <p>プロジェクトがありません。「新規プロジェクト」から作成してください。</p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '24px',
            }}
          >
            {projects.map((p) => (
              <div
                key={p.id}
                style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  backgroundColor: 'var(--color-surface)',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div
                  style={{
                    height: '160px',
                    backgroundColor: '#e0e0e0',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onClick={() => handleOpen(p.id)}
                >
                  {previews[p.id] ? (
                    <img
                      src={previews[p.id]}
                      alt="サムネイル"
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <span style={{ color: '#888' }}>No Image</span>
                  )}
                </div>
                <div style={{ padding: '16px' }}>
                  <h3
                    style={{ margin: '0 0 8px 0', fontSize: '1.1rem', cursor: 'pointer' }}
                    onClick={() => handleOpen(p.id)}
                  >
                    {p.name}
                  </h3>
                  <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: '#666' }}>
                    更新: {new Date(p.updatedAt).toLocaleString()}
                    <br />
                    サイズ: {p.canvas.width} × {p.canvas.height}
                  </p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      className="button-secondary"
                      style={{ padding: '4px 8px', fontSize: '0.85rem' }}
                      onClick={() => handleRename(p.id, p.name)}
                    >
                      名前変更
                    </button>
                    <button
                      className="button-secondary"
                      style={{ padding: '4px 8px', fontSize: '0.85rem' }}
                      onClick={() => handleDuplicate(p.id, p.name)}
                    >
                      複製
                    </button>
                    <button
                      className="button-secondary"
                      style={{ padding: '4px 8px', fontSize: '0.85rem' }}
                      onClick={() => alert('.kampe書き出しは未実装')}
                    >
                      書き出し
                    </button>
                    <button
                      className="button-secondary"
                      style={{
                        padding: '4px 8px',
                        fontSize: '0.85rem',
                        color: '#d32f2f',
                        borderColor: '#d32f2f',
                      }}
                      onClick={() => handleDelete(p.id, p.name)}
                    >
                      削除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

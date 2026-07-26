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
      <header className="screen-header">
        <h1>{APP_DISPLAY_NAME}</h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button className="button-secondary" onClick={() => navigationService.navigate('/help')}>
            ❓ ヘルプ
          </button>
          <button className="button-primary" onClick={handleCreateNew}>
            ✨ 新規プロジェクト
          </button>
        </div>
      </header>

      <main className="screen-content">
        {isLoading ? (
          <div className="empty-state">
            <p>読み込み中...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🎨</div>
            <p>
              まだプロジェクトがありません。
              <br />
              「新規プロジェクト」からカンペを作成しましょう！
            </p>
            <button className="button-primary" onClick={handleCreateNew}>
              ✨ 新規プロジェクトを作成
            </button>
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
              <div key={p.id} className="project-card">
                <div
                  className="project-card-thumbnail"
                  onClick={() => handleOpen(p.id)}
                  title="クリックして開く"
                >
                  {previews[p.id] ? (
                    <img src={previews[p.id]} alt="サムネイル" />
                  ) : (
                    <div className="project-card-no-image">🖼️ 画像なし</div>
                  )}
                </div>
                <div className="project-card-info">
                  <h3
                    className="project-card-title"
                    onClick={() => handleOpen(p.id)}
                    title={p.name}
                  >
                    {p.name}
                  </h3>
                  <div className="project-card-meta">
                    <div>
                      📅 更新:{' '}
                      {new Date(p.updatedAt).toLocaleString('ja-JP', {
                        month: 'numeric',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    <div>
                      📐 サイズ: {p.canvas.width} × {p.canvas.height} px
                    </div>
                  </div>
                  <div className="project-card-actions">
                    <button
                      className="button-secondary"
                      style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                      onClick={() => handleRename(p.id, p.name)}
                    >
                      ✏️ 名前変更
                    </button>
                    <button
                      className="button-secondary"
                      style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                      onClick={() => handleDuplicate(p.id, p.name)}
                    >
                      📋 複製
                    </button>
                    <button
                      className="button-secondary"
                      style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                      onClick={() => alert('.kampe書き出しは未実装')}
                    >
                      📦 書き出し
                    </button>
                    <button className="button-danger" onClick={() => handleDelete(p.id, p.name)}>
                      🗑️ 削除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

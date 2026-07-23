import React from 'react'
import { useProjectStore } from '../../store/projectStore'
import { useEditorStore } from '../../store/editorStore'
import type { CanvasElement } from '../../models/element'

export function LayersTab() {
  const project = useProjectStore((s) => s.project)
  const updateElement = useProjectStore((s) => s.updateElement)
  const removeElement = useProjectStore((s) => s.removeElement)
  const bringToFront = useProjectStore((s) => s.bringToFront)
  const bringForward = useProjectStore((s) => s.bringForward)
  const sendBackward = useProjectStore((s) => s.sendBackward)
  const sendToBack = useProjectStore((s) => s.sendToBack)

  const selectedRefs = useEditorStore((s) => s.selectedElements)
  const setSelectedElements = useEditorStore((s) => s.setSelectedElements)

  if (!project) return null

  // We need to build a hierarchical list from bottom-up elements array, but display it top-down.
  // We process elements/groups as blocks
  const blocks: {
    id: string
    isGroup: boolean
    elements: CanvasElement[]
    name: string
    visible: boolean
    locked: boolean
  }[] = []
  let currentGroupId: string | null = null
  let currentGroupElements: CanvasElement[] = []

  for (const el of project.elements) {
    if (el.groupId) {
      if (currentGroupId !== el.groupId) {
        if (currentGroupId) {
          const g = project.groups.find((g) => g.id === currentGroupId)
          blocks.push({
            id: currentGroupId,
            isGroup: true,
            elements: currentGroupElements,
            name: g?.name || 'グループ',
            visible: currentGroupElements.some((e) => e.visible),
            locked: currentGroupElements.every((e) => e.locked),
          })
        }
        currentGroupId = el.groupId
        currentGroupElements = [el]
      } else {
        currentGroupElements.push(el)
      }
    } else {
      if (currentGroupId) {
        const g = project.groups.find((g) => g.id === currentGroupId)
        blocks.push({
          id: currentGroupId,
          isGroup: true,
          elements: currentGroupElements,
          name: g?.name || 'グループ',
          visible: currentGroupElements.some((e) => e.visible),
          locked: currentGroupElements.every((e) => e.locked),
        })
        currentGroupId = null
        currentGroupElements = []
      }
      blocks.push({
        id: el.id,
        isGroup: false,
        elements: [el],
        name: el.name,
        visible: el.visible,
        locked: el.locked,
      })
    }
  }
  if (currentGroupId) {
    const g = project.groups.find((g) => g.id === currentGroupId)
    blocks.push({
      id: currentGroupId,
      isGroup: true,
      elements: currentGroupElements,
      name: g?.name || 'グループ',
      visible: currentGroupElements.some((e) => e.visible),
      locked: currentGroupElements.every((e) => e.locked),
    })
  }

  // Reverse to show top-to-bottom
  blocks.reverse()

  const handleSelect = (id: string, isGroup: boolean, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent canvas deselect
    const ref = { id, type: isGroup ? ('group' as const) : ('element' as const) }
    if (e.shiftKey) {
      const exists = selectedRefs.some((r) => r.id === id && r.type === ref.type)
      if (exists) {
        setSelectedElements(selectedRefs.filter((r) => !(r.id === id && r.type === ref.type)))
      } else {
        setSelectedElements([...selectedRefs, ref])
      }
    } else {
      setSelectedElements([ref])
    }
  }

  const toggleVisible = (id: string, isGroup: boolean, currentVisible: boolean) => {
    if (isGroup) {
      const groupElements = project.elements.filter((el) => el.groupId === id)
      groupElements.forEach((el) => updateElement(el.id, { visible: !currentVisible }))
    } else {
      updateElement(id, { visible: !currentVisible })
    }
  }

  const toggleLock = (id: string, isGroup: boolean, currentLocked: boolean) => {
    if (isGroup) {
      const groupElements = project.elements.filter((el) => el.groupId === id)
      groupElements.forEach((el) => updateElement(el.id, { locked: !currentLocked }))
    } else {
      updateElement(id, { locked: !currentLocked })
    }
  }

  const handleDelete = (id: string, isGroup: boolean) => {
    if (isGroup) {
      const groupElements = project.elements.filter((el) => el.groupId === id)
      groupElements.forEach((el) => removeElement(el.id))
      // It might be better to have a generic action to delete a group, but the user specifies that group ungroup doesn't delete elements.
      // If we just remove elements, the group object is effectively orphaned. It's fine for now, or we can clean it up.
    } else {
      removeElement(id)
    }
  }

  return (
    <div className="layers-tab" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {blocks.length === 0 && <p className="sidebar-placeholder">要素がありません</p>}

      {blocks.map((block) => {
        const isSelected = selectedRefs.some(
          (r) => r.id === block.id && r.type === (block.isGroup ? 'group' : 'element'),
        )

        return (
          <div key={`block-${block.id}`}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '4px 8px',
                background: isSelected ? 'var(--color-bg-hover)' : 'var(--color-bg-surface)',
                border: '1px solid var(--color-border)',
                cursor: 'pointer',
                borderRadius: '4px',
                marginBottom: '4px',
              }}
              onClick={(e) => handleSelect(block.id, block.isGroup, e)}
            >
              <span style={{ marginRight: '8px' }}>
                {block.isGroup
                  ? '📁'
                  : block.elements[0].type === 'image'
                    ? '🖼️'
                    : block.elements[0].type === 'text'
                      ? 'T'
                      : '⭐'}
              </span>
              <span
                style={{
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: '14px',
                }}
              >
                {block.name}
              </span>

              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleVisible(block.id, block.isGroup, block.visible)
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0 4px',
                    filter: block.visible ? 'none' : 'grayscale(1) opacity(0.5)',
                  }}
                  title="表示/非表示"
                >
                  👁️
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleLock(block.id, block.isGroup, block.locked)
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0 4px',
                    filter: block.locked ? 'none' : 'grayscale(1) opacity(0.5)',
                  }}
                  title="ロック/解除"
                >
                  🔒
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(block.id, block.isGroup)
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0 4px',
                  }}
                  title="削除"
                >
                  🗑️
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '8px' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    bringToFront(block.id, block.isGroup)
                  }}
                  style={{ fontSize: '10px', padding: '0 2px', lineHeight: 1 }}
                  title="最前面へ"
                >
                  ⏫
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    bringForward(block.id, block.isGroup)
                  }}
                  style={{ fontSize: '10px', padding: '0 2px', lineHeight: 1 }}
                  title="前面へ"
                >
                  🔼
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    sendBackward(block.id, block.isGroup)
                  }}
                  style={{ fontSize: '10px', padding: '0 2px', lineHeight: 1 }}
                  title="背面へ"
                >
                  🔽
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    sendToBack(block.id, block.isGroup)
                  }}
                  style={{ fontSize: '10px', padding: '0 2px', lineHeight: 1 }}
                  title="最背面へ"
                >
                  ⏬
                </button>
              </div>
            </div>

            {block.isGroup && (
              <div
                style={{ paddingLeft: '24px', display: 'flex', flexDirection: 'column-reverse' }}
              >
                {block.elements.map((el) => {
                  const isChildSelected = selectedRefs.some(
                    (r) => r.id === el.id && r.type === 'element',
                  )
                  return (
                    <div
                      key={el.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '2px 8px',
                        background: isChildSelected ? 'var(--color-bg-hover)' : 'transparent',
                        borderLeft: '1px solid var(--color-border)',
                        cursor: 'pointer',
                        marginBottom: '2px',
                        fontSize: '12px',
                      }}
                      onClick={(e) => handleSelect(el.id, false, e)}
                    >
                      <span style={{ marginRight: '4px' }}>
                        {el.type === 'image' ? '🖼️' : el.type === 'text' ? 'T' : '⭐'}
                      </span>
                      <span
                        style={{
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {el.name}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

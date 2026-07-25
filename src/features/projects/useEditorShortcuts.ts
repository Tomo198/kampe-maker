import { useEffect, useCallback } from 'react'
import { useProjectStore } from '../../store/projectStore'
import { useEditorStore } from '../../store/editorStore'

export function useEditorShortcuts() {
  const undo = useProjectStore((s) => s.undo)
  const redo = useProjectStore((s) => s.redo)
  const cropMode = useEditorStore((s) => s.cropMode)

  const cleanupSelection = useCallback(() => {
    // After undo/redo, the project elements might have changed.
    // If a selected element no longer exists, we should clear it from selection.
    setTimeout(() => {
      const currentProject = useProjectStore.getState().project
      const currentSelection = useEditorStore.getState().selectedElements
      if (!currentProject || currentSelection.length === 0) return

      const validSelection = currentSelection.filter((ref) => {
        if (ref.type === 'element') {
          return currentProject.elements.some((el) => el.id === ref.id)
        } else {
          return currentProject.groups.some((g) => g.id === ref.id)
        }
      })

      if (validSelection.length !== currentSelection.length) {
        useEditorStore.getState().setSelectedElements(validSelection)
      }
    }, 0)
  }, [])

  const handleUndo = useCallback(() => {
    undo()
    cleanupSelection()
  }, [undo, cleanupSelection])

  const handleRedo = useCallback(() => {
    redo()
    cleanupSelection()
  }, [redo, cleanupSelection])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If focusing on an input, textarea, or contenteditable, don't trigger app-level undo/redo
      const active = document.activeElement
      if (active) {
        const tag = active.tagName.toLowerCase()
        if (
          tag === 'input' ||
          tag === 'textarea' ||
          tag === 'select' ||
          active.getAttribute('contenteditable') === 'true'
        ) {
          return
        }
      }

      // If in crop mode, disable global undo/redo
      if (cropMode) {
        return
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const isCmdOrCtrl = isMac ? e.metaKey : e.ctrlKey

      if (isCmdOrCtrl && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) {
          handleRedo()
        } else {
          handleUndo()
        }
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        handleRedo()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [cropMode, handleUndo, handleRedo])

  return { handleUndo, handleRedo }
}

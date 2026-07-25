import type { CanvasElement } from '../../models/element'
import type { SelectionRef } from '../../store/editorStore'

export function handleNodeSelect(
  elementId: string,
  isShiftPressed: boolean,
  projectElements: CanvasElement[],
  selectedElements: SelectionRef[],
  editingGroupId: string | null,
  setSelectedElements: (elements: SelectionRef[]) => void,
) {
  const targetElement = projectElements.find((el) => el.id === elementId)
  if (!targetElement) return
  if (!targetElement.visible) return // Hidden elements cannot be selected

  let newRef: SelectionRef

  // If the element belongs to a group, and we are NOT editing that group specifically
  if (targetElement.groupId && editingGroupId !== targetElement.groupId) {
    newRef = { type: 'group', id: targetElement.groupId }
  } else {
    newRef = { type: 'element', id: elementId }
  }

  if (isShiftPressed) {
    const isAlreadySelected = selectedElements.some(
      (ref) => ref.type === newRef.type && ref.id === newRef.id,
    )
    if (isAlreadySelected) {
      // Remove from selection
      setSelectedElements(
        selectedElements.filter((ref) => !(ref.type === newRef.type && ref.id === newRef.id)),
      )
    } else {
      // Add to selection
      setSelectedElements([...selectedElements, newRef])
    }
  } else {
    // Replace selection
    const isAlreadySelected = selectedElements.some(
      (ref) => ref.type === newRef.type && ref.id === newRef.id,
    )
    // If it's already selected and we just clicked it without shift, keep it selected
    // (This allows drag to work smoothly if multiple are selected).
    if (!isAlreadySelected) {
      setSelectedElements([newRef])
    }
  }
}

import { describe, it, expect, vi } from 'vitest'
import { handleNodeSelect } from './selectionHandler'
import type { CanvasElement } from '../../models/element'
import type { SelectionRef } from '../../store/editorStore'

describe('handleNodeSelect', () => {
  const elements: CanvasElement[] = [
    { id: 'el1', type: 'text', visible: true, locked: false, name: 'T1' } as CanvasElement,
    { id: 'el2', type: 'image', visible: false, locked: false, name: 'I1' } as CanvasElement,
    { id: 'el3', type: 'shape', visible: true, locked: true, name: 'S1' } as CanvasElement,
    {
      id: 'el4',
      type: 'stamp',
      visible: true,
      locked: false,
      groupId: 'g1',
      name: 'ST1',
    } as CanvasElement,
    {
      id: 'el5',
      type: 'text',
      visible: true,
      locked: false,
      groupId: 'g1',
      name: 'T2',
    } as CanvasElement,
  ]

  it('selects a normal element (replaces selection)', () => {
    const setSelection = vi.fn()
    handleNodeSelect('el1', false, elements, [], null, setSelection)
    expect(setSelection).toHaveBeenCalledWith([{ type: 'element', id: 'el1' }])
  })

  it('ignores hidden elements', () => {
    const setSelection = vi.fn()
    handleNodeSelect('el2', false, elements, [], null, setSelection)
    expect(setSelection).not.toHaveBeenCalled()
  })

  it('allows selecting locked elements', () => {
    const setSelection = vi.fn()
    handleNodeSelect('el3', false, elements, [], null, setSelection)
    expect(setSelection).toHaveBeenCalledWith([{ type: 'element', id: 'el3' }])
  })

  it('selects the whole group when clicking a group member in normal mode', () => {
    const setSelection = vi.fn()
    handleNodeSelect('el4', false, elements, [], null, setSelection)
    expect(setSelection).toHaveBeenCalledWith([{ type: 'group', id: 'g1' }])
  })

  it('selects the individual element when editing the same group', () => {
    const setSelection = vi.fn()
    handleNodeSelect('el4', false, elements, [], 'g1', setSelection)
    expect(setSelection).toHaveBeenCalledWith([{ type: 'element', id: 'el4' }])
  })

  it('adds to selection when Shift is pressed', () => {
    const setSelection = vi.fn()
    const currentSelection: SelectionRef[] = [{ type: 'element', id: 'el3' }]
    handleNodeSelect('el1', true, elements, currentSelection, null, setSelection)
    expect(setSelection).toHaveBeenCalledWith([
      { type: 'element', id: 'el3' },
      { type: 'element', id: 'el1' },
    ])
  })

  it('removes from selection when Shift is pressed and already selected', () => {
    const setSelection = vi.fn()
    const currentSelection: SelectionRef[] = [
      { type: 'element', id: 'el3' },
      { type: 'element', id: 'el1' },
    ]
    handleNodeSelect('el1', true, elements, currentSelection, null, setSelection)
    expect(setSelection).toHaveBeenCalledWith([{ type: 'element', id: 'el3' }])
  })

  it('does not clear selection when clicking an already selected element without Shift', () => {
    const setSelection = vi.fn()
    const currentSelection: SelectionRef[] = [
      { type: 'element', id: 'el1' },
      { type: 'element', id: 'el3' },
    ]
    handleNodeSelect('el1', false, elements, currentSelection, null, setSelection)
    expect(setSelection).not.toHaveBeenCalled()
  })
})

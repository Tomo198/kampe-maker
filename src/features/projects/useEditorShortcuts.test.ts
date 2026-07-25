import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useEditorShortcuts } from './useEditorShortcuts'
import { useProjectStore } from '../../store/projectStore'
import { useEditorStore } from '../../store/editorStore'

// Mock zustand stores
vi.mock('../../store/projectStore', () => ({
  useProjectStore: Object.assign(vi.fn(), {
    getState: vi.fn(),
  }),
}))

vi.mock('../../store/editorStore', () => ({
  useEditorStore: Object.assign(vi.fn(), {
    getState: vi.fn(),
  }),
}))

describe('useEditorShortcuts', () => {
  let undoMock: ReturnType<typeof vi.fn>
  let redoMock: ReturnType<typeof vi.fn>
  let cropModeMock: unknown

  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    undoMock = vi.fn()
    redoMock = vi.fn()
    cropModeMock = null

    // Setup mocks
    vi.mocked(useProjectStore.getState).mockReturnValue({ project: null } as unknown as ReturnType<
      typeof useProjectStore.getState
    >)
    vi.mocked(useEditorStore.getState).mockReturnValue({
      selectedElements: [],
      setSelectedElements: vi.fn(),
    } as unknown as ReturnType<typeof useEditorStore.getState>)

    vi.mocked(useProjectStore).mockImplementation((selector: unknown) => {
      const state = { undo: undoMock, redo: redoMock, project: null }
      return (selector as (s: typeof state) => unknown)(state)
    })
    vi.mocked(useEditorStore).mockImplementation((selector: unknown) => {
      const state = { cropMode: cropModeMock, selectedElements: [], setSelectedElements: vi.fn() }
      return (selector as (s: typeof state) => unknown)(state)
    })
  })

  it('triggers undo on Ctrl+Z', () => {
    renderHook(() => useEditorShortcuts())
    const event = new KeyboardEvent('keydown', { key: 'z', ctrlKey: true })
    window.dispatchEvent(event)
    vi.runAllTimers()
    expect(undoMock).toHaveBeenCalled()
    expect(redoMock).not.toHaveBeenCalled()
  })

  it('triggers redo on Ctrl+Shift+Z', () => {
    renderHook(() => useEditorShortcuts())
    const event = new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, shiftKey: true })
    window.dispatchEvent(event)
    vi.runAllTimers()
    expect(redoMock).toHaveBeenCalled()
  })

  it('triggers redo on Ctrl+Y', () => {
    renderHook(() => useEditorShortcuts())
    const event = new KeyboardEvent('keydown', { key: 'y', ctrlKey: true })
    window.dispatchEvent(event)
    vi.runAllTimers()
    expect(redoMock).toHaveBeenCalled()
  })

  it('does not trigger undo/redo if cropMode is active', () => {
    cropModeMock = { elementId: 'el1' }
    renderHook(() => useEditorShortcuts())
    const event = new KeyboardEvent('keydown', { key: 'z', ctrlKey: true })
    window.dispatchEvent(event)
    expect(undoMock).not.toHaveBeenCalled()
  })

  it('does not trigger undo/redo if active element is an input', () => {
    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()

    renderHook(() => useEditorShortcuts())
    const event = new KeyboardEvent('keydown', { key: 'z', ctrlKey: true })
    window.dispatchEvent(event)
    expect(undoMock).not.toHaveBeenCalled()

    document.body.removeChild(input)
  })

  it('does not trigger undo/redo if active element is contenteditable', () => {
    const div = document.createElement('div')
    div.setAttribute('contenteditable', 'true')
    document.body.appendChild(div)
    div.focus()

    renderHook(() => useEditorShortcuts())
    const event = new KeyboardEvent('keydown', { key: 'z', ctrlKey: true })
    window.dispatchEvent(event)
    vi.runAllTimers()
    expect(undoMock).not.toHaveBeenCalled()

    document.body.removeChild(div)
  })
})

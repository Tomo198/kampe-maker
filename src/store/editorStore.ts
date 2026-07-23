import { create } from 'zustand'

export type SelectionRef = { type: 'element' | 'group'; id: string }

export type EditorState = {
  // Selection
  selectedElements: SelectionRef[]
  setSelectedElements: (elements: SelectionRef[]) => void
  editingGroupId: string | null
  setEditingGroupId: (id: string | null) => void

  // Viewport (Zoom and Pan)
  zoom: number
  setZoom: (zoom: number) => void
  pan: { x: number; y: number }
  setPan: (pan: { x: number; y: number }) => void

  // Ephemeral states
  isDragging: boolean
  setIsDragging: (isDragging: boolean) => void
  isTransforming: boolean
  setIsTransforming: (isTransforming: boolean) => void
  isImporting: boolean
  setIsImporting: (isImporting: boolean) => void
  isExporting: boolean
  setIsExporting: (isExporting: boolean) => void

  // Crop mode
  cropMode: { elementId: string } | null
  setCropMode: (mode: { elementId: string } | null) => void
}

export const useEditorStore = create<EditorState>((set) => ({
  selectedElements: [],
  setSelectedElements: (elements) => set({ selectedElements: elements }),
  editingGroupId: null,
  setEditingGroupId: (id) => set({ editingGroupId: id }),

  zoom: 1,
  setZoom: (zoom) => set({ zoom }),
  pan: { x: 0, y: 0 },
  setPan: (pan) => set({ pan }),

  isDragging: false,
  setIsDragging: (isDragging) => set({ isDragging }),
  isTransforming: false,
  setIsTransforming: (isTransforming) => set({ isTransforming }),
  isImporting: false,
  setIsImporting: (isImporting) => set({ isImporting }),
  isExporting: false,
  setIsExporting: (isExporting) => set({ isExporting }),

  cropMode: null,
  setCropMode: (mode) => set({ cropMode: mode }),
}))

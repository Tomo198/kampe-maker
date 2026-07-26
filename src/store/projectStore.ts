import { create } from 'zustand'
import type { Project, CanvasSettings } from '../models/project'
import type { CanvasElement } from '../models/element'
import type { Asset } from '../models/asset'

type ProjectState = {
  project: Project | null

  // Actions for initialization
  initProject: (project: Project, revision?: number) => void

  // Actions for canvas settings
  updateCanvasSettings: (settings: Partial<CanvasSettings>) => void

  // Actions for elements
  addElement: (element: CanvasElement) => void
  updateElement: (id: string, updates: Partial<CanvasElement>) => void
  updateElements: (updates: { id: string; updates: Partial<CanvasElement> }[]) => void
  removeElement: (id: string) => void

  // Actions for assets
  addAsset: (asset: Asset) => void
  removeAsset: (id: string) => void
  deleteAsset: (id: string, withElements: boolean) => void

  // Actions for groups
  groupElements: (elementIds: string[]) => void
  ungroupElements: (groupId: string) => void

  // History
  past: Project[]
  future: Project[]

  // Actions for history
  undo: () => void
  redo: () => void

  // Actions for layers
  // Actions for layers
  bringToFront: (id: string, isGroup?: boolean) => void
  sendToBack: (id: string, isGroup?: boolean) => void
  bringForward: (id: string, isGroup?: boolean) => void
  sendBackward: (id: string, isGroup?: boolean) => void

  // Revision tracking
  projectRevision: number
  lastSavedRevision: number
  setLastSavedRevision: (rev: number) => void
}

const commitProjectUpdate = (state: ProjectState, newProject: Project): Partial<ProjectState> => {
  if (!state.project) return {}
  if (state.project === newProject) return {} // Fast path: identical reference

  // Fast path: check if array references and canvas settings are untouched
  if (
    state.project.name === newProject.name &&
    state.project.canvas === newProject.canvas &&
    state.project.elements === newProject.elements &&
    state.project.assets === newProject.assets &&
    state.project.groups === newProject.groups
  ) {
    return {}
  }

  // Deep comparison ignoring updatedAt when references differ
  const currentData = { ...state.project, updatedAt: '' }
  const newData = { ...newProject, updatedAt: '' }
  if (JSON.stringify(currentData) === JSON.stringify(newData)) {
    return {} // No structural change
  }

  const newPast = [...state.past, state.project]
  if (newPast.length > 50) newPast.shift()

  return {
    project: { ...newProject, updatedAt: new Date().toISOString() },
    past: newPast,
    future: [],
    projectRevision: state.projectRevision + 1,
  }
}

export const useProjectStore = create<ProjectState>((set) => ({
  project: null,

  past: [],
  future: [],
  projectRevision: 0,
  lastSavedRevision: 0,
  setLastSavedRevision: (lastSavedRevision) => set({ lastSavedRevision }),

  initProject: (project, revision = 0) =>
    set({ project, past: [], future: [], projectRevision: revision, lastSavedRevision: revision }),

  undo: () =>
    set((state) => {
      if (!state.project || state.past.length === 0) return state
      const newPast = [...state.past]
      const previousProject = newPast.pop()!
      return {
        project: previousProject,
        past: newPast,
        future: [state.project, ...state.future],
        projectRevision: state.projectRevision + 1,
      }
    }),

  redo: () =>
    set((state) => {
      if (!state.project || state.future.length === 0) return state
      const newFuture = [...state.future]
      const nextProject = newFuture.shift()!
      return {
        project: nextProject,
        past: [...state.past, state.project],
        future: newFuture,
        projectRevision: state.projectRevision + 1,
      }
    }),

  updateCanvasSettings: (settings) =>
    set((state) => {
      if (!state.project) return state
      return commitProjectUpdate(state, {
        ...state.project,
        canvas: { ...state.project.canvas, ...settings },
      })
    }),

  addElement: (element) =>
    set((state) => {
      if (!state.project) return state
      return commitProjectUpdate(state, {
        ...state.project,
        elements: [...state.project.elements, element],
      })
    }),

  updateElement: (id, updates) =>
    set((state) => {
      if (!state.project) return state
      const elements = state.project.elements.map((el) =>
        el.id === id ? ({ ...el, ...updates } as CanvasElement) : el,
      )
      return commitProjectUpdate(state, { ...state.project, elements })
    }),

  updateElements: (updates) =>
    set((state) => {
      if (!state.project || updates.length === 0) return state
      const p = state.project

      const elements = p.elements.map((el) => {
        const update = updates.find((u) => u.id === el.id)
        if (update) {
          return { ...el, ...update.updates } as CanvasElement
        }
        return el
      })

      return commitProjectUpdate(state, { ...p, elements })
    }),

  removeElement: (id) =>
    set((state) => {
      if (!state.project) return state
      return commitProjectUpdate(state, {
        ...state.project,
        elements: state.project.elements.filter((el) => el.id !== id),
      })
    }),

  addAsset: (asset) =>
    set((state) => {
      if (!state.project) return state
      return commitProjectUpdate(state, {
        ...state.project,
        assets: [...state.project.assets, asset],
      })
    }),

  removeAsset: (id) =>
    set((state) => {
      if (!state.project) return state
      return commitProjectUpdate(state, {
        ...state.project,
        assets: state.project.assets.filter((a) => a.id !== id),
      })
    }),

  deleteAsset: (id, withElements) =>
    set((state) => {
      if (!state.project) return state
      const assets = state.project.assets.filter((a) => a.id !== id)
      let elements = state.project.elements
      if (withElements) {
        elements = elements.filter((el) => !(el.type === 'image' && el.assetId === id))
      }
      return commitProjectUpdate(state, {
        ...state.project,
        assets,
        elements,
      })
    }),

  groupElements: (elementIds) =>
    set((state) => {
      if (!state.project || elementIds.length < 2) return state

      const p = state.project

      // Validation: elements must exist, not be locked, not be hidden, and not already in a group
      const targets = p.elements.filter((el) => elementIds.includes(el.id))
      if (targets.length !== elementIds.length) return state
      if (targets.some((el) => el.locked || !el.visible || el.groupId)) return state

      const groupId = crypto.randomUUID()
      const newGroup = { id: groupId, name: `グループ`, elementIds: targets.map((t) => t.id) }

      // We need to move all target elements into a contiguous block in the elements array,
      // preserving their relative order.
      // Find the highest index among targets to place the block.
      let highestIndex = -1
      for (const t of targets) {
        const idx = p.elements.findIndex((el) => el.id === t.id)
        if (idx > highestIndex) highestIndex = idx
      }

      const nonTargets = p.elements.filter((el) => !elementIds.includes(el.id))
      const updatedTargets = targets.map((t) => ({ ...t, groupId }))

      const newElements = [
        ...nonTargets.slice(0, highestIndex - targets.length + 1),
        ...updatedTargets,
        ...nonTargets.slice(highestIndex - targets.length + 1),
      ]

      return commitProjectUpdate(state, {
        ...p,
        elements: newElements,
        groups: [...p.groups, newGroup],
      })
    }),

  ungroupElements: (groupId) =>
    set((state) => {
      if (!state.project) return state
      const p = state.project

      const groupExists = p.groups.some((g) => g.id === groupId)
      if (!groupExists) return state

      const newGroups = p.groups.filter((g) => g.id !== groupId)
      const newElements = p.elements.map((el) =>
        el.groupId === groupId ? { ...el, groupId: undefined } : el,
      )

      return commitProjectUpdate(state, {
        ...p,
        elements: newElements,
        groups: newGroups,
      })
    }),

  bringToFront: (id, isGroup) =>
    set((state) => {
      if (!state.project) return state
      const p = state.project
      let elementsToMove: CanvasElement[]
      let newElements = [...p.elements]

      if (isGroup) {
        elementsToMove = p.elements.filter((el) => el.groupId === id)
        if (elementsToMove.length === 0) return state
        newElements = p.elements.filter((el) => el.groupId !== id)
      } else {
        const elIndex = p.elements.findIndex((e) => e.id === id)
        if (elIndex < 0) return state
        const el = p.elements[elIndex]
        if (el.groupId) return state // Cannot independently move element inside a group
        elementsToMove = [el]
        newElements.splice(elIndex, 1)
      }

      newElements.push(...elementsToMove) // move to front (end of array)
      return commitProjectUpdate(state, { ...p, elements: newElements })
    }),

  sendToBack: (id, isGroup) =>
    set((state) => {
      if (!state.project) return state
      const p = state.project
      let elementsToMove: CanvasElement[]
      let newElements = [...p.elements]

      if (isGroup) {
        elementsToMove = p.elements.filter((el) => el.groupId === id)
        if (elementsToMove.length === 0) return state
        newElements = p.elements.filter((el) => el.groupId !== id)
      } else {
        const elIndex = p.elements.findIndex((e) => e.id === id)
        if (elIndex < 0) return state
        const el = p.elements[elIndex]
        if (el.groupId) return state
        elementsToMove = [el]
        newElements.splice(elIndex, 1)
      }

      newElements.unshift(...elementsToMove) // move to back (start of array)
      return commitProjectUpdate(state, { ...p, elements: newElements })
    }),

  bringForward: (id, isGroup) =>
    set((state) => {
      if (!state.project) return state
      const p = state.project

      // We process elements/groups as blocks
      const blocks: { id: string; isGroup: boolean; elements: CanvasElement[] }[] = []
      let currentGroupId: string | null = null
      let currentGroupElements: CanvasElement[] = []

      for (const el of p.elements) {
        if (el.groupId) {
          if (currentGroupId !== el.groupId) {
            if (currentGroupId) {
              blocks.push({ id: currentGroupId, isGroup: true, elements: currentGroupElements })
            }
            currentGroupId = el.groupId
            currentGroupElements = [el]
          } else {
            currentGroupElements.push(el)
          }
        } else {
          if (currentGroupId) {
            blocks.push({ id: currentGroupId, isGroup: true, elements: currentGroupElements })
            currentGroupId = null
            currentGroupElements = []
          }
          blocks.push({ id: el.id, isGroup: false, elements: [el] })
        }
      }
      if (currentGroupId) {
        blocks.push({ id: currentGroupId, isGroup: true, elements: currentGroupElements })
      }

      const blockIndex = blocks.findIndex((b) => b.id === id && b.isGroup === !!isGroup)
      if (blockIndex < 0 || blockIndex === blocks.length - 1) return state // Already at front

      // Swap with next block
      const temp = blocks[blockIndex]
      blocks[blockIndex] = blocks[blockIndex + 1]
      blocks[blockIndex + 1] = temp

      const newElements = blocks.flatMap((b) => b.elements)
      return commitProjectUpdate(state, { ...p, elements: newElements })
    }),

  sendBackward: (id, isGroup) =>
    set((state) => {
      if (!state.project) return state
      const p = state.project

      const blocks: { id: string; isGroup: boolean; elements: CanvasElement[] }[] = []
      let currentGroupId: string | null = null
      let currentGroupElements: CanvasElement[] = []

      for (const el of p.elements) {
        if (el.groupId) {
          if (currentGroupId !== el.groupId) {
            if (currentGroupId) {
              blocks.push({ id: currentGroupId, isGroup: true, elements: currentGroupElements })
            }
            currentGroupId = el.groupId
            currentGroupElements = [el]
          } else {
            currentGroupElements.push(el)
          }
        } else {
          if (currentGroupId) {
            blocks.push({ id: currentGroupId, isGroup: true, elements: currentGroupElements })
            currentGroupId = null
            currentGroupElements = []
          }
          blocks.push({ id: el.id, isGroup: false, elements: [el] })
        }
      }
      if (currentGroupId) {
        blocks.push({ id: currentGroupId, isGroup: true, elements: currentGroupElements })
      }

      const blockIndex = blocks.findIndex((b) => b.id === id && b.isGroup === !!isGroup)
      if (blockIndex <= 0) return state // Already at back

      // Swap with prev block
      const temp = blocks[blockIndex]
      blocks[blockIndex] = blocks[blockIndex - 1]
      blocks[blockIndex - 1] = temp

      const newElements = blocks.flatMap((b) => b.elements)
      return commitProjectUpdate(state, { ...p, elements: newElements })
    }),
}))

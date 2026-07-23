import { create } from 'zustand'

export type AppScreen = 'projectList' | 'newProject' | 'editor' | 'help'

export type SidebarTab = 'assets' | 'text' | 'stamps' | 'shapes' | 'layers'

export type SaveStatus = 'idle' | 'dirty' | 'scheduled' | 'saving' | 'saved' | 'error'

type UIState = {
  // Screen navigation
  currentScreen: AppScreen
  setScreen: (screen: AppScreen) => void

  // Sidebar
  activeSidebarTab: SidebarTab
  setSidebarTab: (tab: SidebarTab) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void

  // Property panel
  propertyPanelOpen: boolean
  setPropertyPanelOpen: (open: boolean) => void

  // Save status
  saveStatus: SaveStatus
  setSaveStatus: (status: SaveStatus) => void
  lastSavedAt: string | null
  setLastSavedAt: (time: string | null) => void

  // Current project id
  currentProjectId: string | null
  setCurrentProjectId: (id: string | null) => void
}

export const useUIStore = create<UIState>((set) => ({
  currentScreen: 'projectList',
  setScreen: (screen) => set({ currentScreen: screen }),

  activeSidebarTab: 'assets',
  setSidebarTab: (tab) => set({ activeSidebarTab: tab }),
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  propertyPanelOpen: true,
  setPropertyPanelOpen: (open) => set({ propertyPanelOpen: open }),

  saveStatus: 'idle',
  setSaveStatus: (status) => set({ saveStatus: status }),
  lastSavedAt: null,
  setLastSavedAt: (time) => set({ lastSavedAt: time }),

  currentProjectId: null,
  setCurrentProjectId: (id) => set({ currentProjectId: id }),
}))

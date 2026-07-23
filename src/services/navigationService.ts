import { useUIStore } from '../store/uiStore'

export const navigationService = {
  navigate(path: string) {
    window.location.hash = path
  },

  handleHashChange() {
    const hash = window.location.hash.replace(/^#/, '') || '/projects'
    const uiStore = useUIStore.getState()

    if (hash === '/projects') {
      uiStore.setScreen('projectList')
      uiStore.setCurrentProjectId(null)
    } else if (hash === '/projects/new') {
      uiStore.setScreen('newProject')
      uiStore.setCurrentProjectId(null)
    } else if (hash.startsWith('/projects/')) {
      const projectId = hash.replace('/projects/', '')
      uiStore.setCurrentProjectId(projectId)
      uiStore.setScreen('editor')
    } else if (hash === '/help') {
      uiStore.setScreen('help')
    } else {
      // fallback
      window.location.hash = '/projects'
    }
  },

  init() {
    window.addEventListener('hashchange', this.handleHashChange)
    // Initial parse
    this.handleHashChange()
  },

  cleanup() {
    window.removeEventListener('hashchange', this.handleHashChange)
  }
}

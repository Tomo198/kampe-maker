import { useEffect, useRef, useCallback } from 'react'
import { useProjectStore } from '../../store/projectStore'
import { useUIStore } from '../../store/uiStore'
import { db } from '../../db/database'
import type { ProjectRecord } from '../../db/types'
import { exportToBlob } from '../export/exportImage'

let savePromiseChain: Promise<void> = Promise.resolve()

export function useAutoSave() {
  const projectRevision = useProjectStore(s => s.projectRevision)
  const lastSavedRevision = useProjectStore(s => s.lastSavedRevision)
  const setLastSavedRevision = useProjectStore(s => s.setLastSavedRevision)
  
  const setSaveStatus = useUIStore(s => s.setSaveStatus)
  const setLastSavedAt = useUIStore(s => s.setLastSavedAt)
  
  const saveTimeoutRef = useRef<number | null>(null)
  const thumbnailTimeoutRef = useRef<number | null>(null)
  
  const triggerImmediateSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
    }

    const currentProject = useProjectStore.getState().project
    const currentRevision = useProjectStore.getState().projectRevision
    const currentSavedRev = useProjectStore.getState().lastSavedRevision
    
    if (!currentProject || currentRevision <= currentSavedRev) return

    setSaveStatus('saving')

    // Serialize saving
    savePromiseChain = savePromiseChain.then(async () => {
      try {
        const record: ProjectRecord = {
          id: currentProject.id,
          name: currentProject.name,
          createdAt: currentProject.createdAt,
          updatedAt: new Date().toISOString(),
          formatVersion: currentProject.formatVersion,
          canvas: currentProject.canvas,
          assets: currentProject.assets,
          elements: currentProject.elements,
          groups: currentProject.groups
        }
        await db.projects.put(record)
        setLastSavedRevision(currentRevision)
        setLastSavedAt(record.updatedAt)
        
        // If no new changes happened while saving
        if (useProjectStore.getState().projectRevision === currentRevision) {
          setSaveStatus('saved')
        }
      } catch (err) {
        console.error('Save error', err)
        setSaveStatus('error')
      }
    })
  }, [setLastSavedRevision, setLastSavedAt, setSaveStatus])

  const generateAndSaveThumbnail = useCallback(async () => {
    const currentProject = useProjectStore.getState().project
    if (!currentProject) return

    try {
      // Export to webp at 480px max edge
      const blob = await exportToBlob(currentProject, { maxEdge: 480, mimeType: 'image/webp' })
      if (blob) {
        await db.projectPreviews.put({
          projectId: currentProject.id,
          updatedAt: new Date().toISOString(),
          blob
        })
      }
    } catch (e) {
      console.error('Thumbnail generation failed', e)
    }
  }, [])

  // Track visibility to trigger immediate save on hide
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        const currentRev = useProjectStore.getState().projectRevision
        const lastRev = useProjectStore.getState().lastSavedRevision
        if (currentRev > lastRev) {
           triggerImmediateSave()
        }
      }
    }
    
    // Track beforeunload
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const status = useUIStore.getState().saveStatus
      if (status === 'dirty' || status === 'scheduled' || status === 'saving') {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [triggerImmediateSave])

  useEffect(() => {
    if (projectRevision > lastSavedRevision) {
      setSaveStatus('scheduled')
      
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current)
      }
      
      saveTimeoutRef.current = window.setTimeout(() => {
        triggerImmediateSave()
      }, 1000)

      // Schedule thumbnail after 5s of inactivity
      if (thumbnailTimeoutRef.current) {
        window.clearTimeout(thumbnailTimeoutRef.current)
      }
      thumbnailTimeoutRef.current = window.setTimeout(() => {
        generateAndSaveThumbnail()
      }, 5000)
    }
  }, [projectRevision, lastSavedRevision, setSaveStatus, triggerImmediateSave, generateAndSaveThumbnail])

  return { triggerImmediateSave, generateAndSaveThumbnail }
}



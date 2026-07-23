import { useEffect } from 'react'
import { processImageFile, ImageImportError, type ProcessedImage } from './imageProcessor'
import { db } from '../../db/database'
import { useProjectStore } from '../../store/projectStore'
import { FULL_CROP } from '../../models/crop'
import type { Asset } from '../../models/asset'
import type { ImageElement } from '../../models/element'
import { useUIStore } from '../../store/uiStore'

export function useImageImport() {
  const { addAsset, addElement } = useProjectStore()
  const { currentProjectId } = useUIStore()

  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      // Ignore paste if focusing on input/textarea/contenteditable
      const active = document.activeElement
      if (active) {
        const tag = active.tagName.toLowerCase()
        const isEditable = active.getAttribute('contenteditable') === 'true'
        if (tag === 'input' || tag === 'textarea' || isEditable) {
          return
        }
      }

      if (!e.clipboardData || !e.clipboardData.items) return

      const items = Array.from(e.clipboardData.items)
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault()
          const file = item.getAsFile()
          if (file) {
            await importFile(file)
          }
          break // import only the first image
        }
      }
    }

    const importFile = async (file: File) => {
      try {
        const result = await processImageFile(file)
        let data = result
        if ('warning' in result) {
          alert(result.warning) // Show warning if exists
          data = result.data
        }

        const typedData = data as ProcessedImage
        const { originalBlob, previewBlob, thumbnailBlob, width, height, mimeType } = typedData

        // IDs
        const pId = currentProjectId || 'default-project' // Phase 1 fallback
        const assetId = crypto.randomUUID()
        const origKey = `${pId}_${assetId}_orig`
        const prevKey = `${pId}_${assetId}_prev`
        const thumbKey = `${pId}_${assetId}_thumb`
        const now = new Date().toISOString()

        // Save to DB
        await db.blobs.bulkPut([
          {
            key: origKey,
            projectId: pId,
            assetId,
            kind: 'original',
            blob: originalBlob,
            createdAt: now,
          },
          {
            key: prevKey,
            projectId: pId,
            assetId,
            kind: 'preview',
            blob: previewBlob,
            createdAt: now,
          },
          {
            key: thumbKey,
            projectId: pId,
            assetId,
            kind: 'thumbnail',
            blob: thumbnailBlob,
            createdAt: now,
          },
        ])

        // Create Asset
        const asset: Asset = {
          id: assetId,
          name: file.name || 'Pasted Image',
          mimeType,
          width,
          height,
          sizeBytes: originalBlob.size,
          originalBlobKey: origKey,
          previewBlobKey: prevKey,
          thumbnailBlobKey: thumbKey,
          createdAt: now,
        }
        addAsset(asset)

        // Create ImageElement
        // Center the element approximately. We don't have viewport bounds here easily, so we just set x, y to 0,0 for now
        // In reality we should center it based on pan/zoom, but for MVP x: 100, y: 100 is okay
        const elId = crypto.randomUUID()
        const element: ImageElement = {
          id: elId,
          type: 'image',
          name: asset.name,
          assetId: asset.id,
          x: 100,
          y: 100,
          width: Math.min(width, 800), // initial scale down if too large
          height: Math.min(width, 800) * (height / width),
          rotation: 0,
          opacity: 1,
          visible: true,
          locked: false,
          crop: FULL_CROP,
          cornerRadius: 0,
        }
        addElement(element)
      } catch (err) {
        if (err instanceof ImageImportError) {
          alert(err.message)
        } else {
          console.error(err)
          alert('画像の読み込みに失敗しました。')
        }
      }
    }

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()

      if (!e.dataTransfer || !e.dataTransfer.files) return

      for (const file of Array.from(e.dataTransfer.files)) {
        if (file.type.startsWith('image/')) {
          await importFile(file)
        }
      }
    }

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
    }

    window.addEventListener('paste', handlePaste)
    window.addEventListener('drop', handleDrop)
    window.addEventListener('dragover', handleDragOver)

    return () => {
      window.removeEventListener('paste', handlePaste)
      window.removeEventListener('drop', handleDrop)
      window.removeEventListener('dragover', handleDragOver)
    }
  }, [currentProjectId, addAsset, addElement])

  return {
    handleFileSelect: async (file: File) => {
      try {
        const result = await processImageFile(file)
        let data = result
        if ('warning' in result) {
          alert(result.warning)
          data = result.data
        }

        const typedData = data as ProcessedImage
        const { originalBlob, previewBlob, thumbnailBlob, width, height, mimeType } = typedData

        const pId = currentProjectId || 'default-project'
        const assetId = crypto.randomUUID()
        const origKey = `${pId}_${assetId}_orig`
        const prevKey = `${pId}_${assetId}_prev`
        const thumbKey = `${pId}_${assetId}_thumb`
        const now = new Date().toISOString()

        await db.blobs.bulkPut([
          {
            key: origKey,
            projectId: pId,
            assetId,
            kind: 'original',
            blob: originalBlob,
            createdAt: now,
          },
          {
            key: prevKey,
            projectId: pId,
            assetId,
            kind: 'preview',
            blob: previewBlob,
            createdAt: now,
          },
          {
            key: thumbKey,
            projectId: pId,
            assetId,
            kind: 'thumbnail',
            blob: thumbnailBlob,
            createdAt: now,
          },
        ])

        const asset: Asset = {
          id: assetId,
          name: file.name || 'Imported Image',
          mimeType,
          width,
          height,
          sizeBytes: originalBlob.size,
          originalBlobKey: origKey,
          previewBlobKey: prevKey,
          thumbnailBlobKey: thumbKey,
          createdAt: now,
        }
        addAsset(asset)

        const elId = crypto.randomUUID()
        const element: ImageElement = {
          id: elId,
          type: 'image',
          name: asset.name,
          assetId: asset.id,
          x: 100,
          y: 100,
          width: Math.min(width, 800),
          height: Math.min(width, 800) * (height / width),
          rotation: 0,
          opacity: 1,
          visible: true,
          locked: false,
          crop: FULL_CROP,
          cornerRadius: 0,
        }
        addElement(element)
      } catch (err) {
        if (err instanceof ImageImportError) {
          alert(err.message)
        } else {
          console.error(err)
          alert('画像の読み込みに失敗しました。')
        }
      }
    },
  }
}

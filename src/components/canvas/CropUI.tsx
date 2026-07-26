import React, { useEffect, useRef, useState } from 'react'
import { Group, Rect, Image as KonvaImage, Transformer } from 'react-konva'
import type Konva from 'konva'
import type { ImageElement } from '../../models/element'
import { useProjectStore } from '../../store/projectStore'
import { useEditorStore } from '../../store/editorStore'
import { FULL_CROP, type NormalizedCrop } from '../../models/crop'
import { calculateCroppedElement } from '../../utils/crop'
import { useObjectURL } from '../../features/assets/useObjectURL'

export const CropUI: React.FC<{
  element: ImageElement
}> = ({ element }) => {
  const updateElement = useProjectStore((s) => s.updateElement)
  const setCropMode = useEditorStore((s) => s.setCropMode)
  const project = useProjectStore((s) => s.project)
  const [localCrop, setLocalCrop] = useState<NormalizedCrop>(
    element.crop &&
      typeof element.crop.width === 'number' &&
      element.crop.width > 0 &&
      element.crop.height > 0
      ? element.crop
      : FULL_CROP,
  )

  const previewKey = React.useMemo(() => {
    if (!project) return null
    const asset = project.assets.find((a) => a.id === element.assetId)
    return asset ? asset.previewBlobKey || asset.originalBlobKey : null
  }, [project, element.assetId])

  const objectUrl = useObjectURL(previewKey)
  const [image, setImage] = useState<HTMLImageElement | null>(null)

  useEffect(() => {
    if (!objectUrl) return
    let isMounted = true
    const img = new Image()
    img.onload = () => {
      if (isMounted && img.naturalWidth > 0 && img.naturalHeight > 0) {
        setImage(img)
      }
    }
    img.src = objectUrl
    return () => {
      isMounted = false
    }
  }, [objectUrl])

  const fullElement = React.useMemo(() => {
    return calculateCroppedElement(element, FULL_CROP)
  }, [element])

  const rectRef = useRef<Konva.Rect>(null)
  const trRef = useRef<Konva.Transformer>(null)

  useEffect(() => {
    if (trRef.current && rectRef.current) {
      trRef.current.nodes([rectRef.current])
      trRef.current.getLayer()?.batchDraw()
    }
  }, [image])

  const handleApply = React.useCallback(() => {
    const newElement = calculateCroppedElement(fullElement, localCrop)
    updateElement(element.id, {
      crop: localCrop,
      x: newElement.x,
      y: newElement.y,
      width: newElement.width,
      height: newElement.height,
    })
    setCropMode(null)
  }, [fullElement, localCrop, element.id, updateElement, setCropMode])

  const handleCancel = React.useCallback(() => {
    setCropMode(null)
  }, [setCropMode])

  // Keybindings for Enter (Apply) and Escape (Cancel)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleApply()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        handleCancel()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleApply, handleCancel])

  const cropRectX = fullElement.x + localCrop.x * fullElement.width
  const cropRectY = fullElement.y + localCrop.y * fullElement.height
  const cropRectWidth = localCrop.width * fullElement.width
  const cropRectHeight = localCrop.height * fullElement.height

  const handleDragOrTransform = () => {
    if (!rectRef.current) return
    const node = rectRef.current

    // Konva scale changes during transform
    const scaleX = node.scaleX()
    const scaleY = node.scaleY()

    // Reset scale to 1 internally for smooth updates, update width/height instead
    node.scaleX(1)
    node.scaleY(1)

    const newW = node.width() * scaleX
    const newH = node.height() * scaleY
    const newX = node.x()
    const newY = node.y()

    // Map back to NormalizedCrop (0..1) relative to fullElement
    let nx = (newX - fullElement.x) / fullElement.width
    let ny = (newY - fullElement.y) / fullElement.height
    let nw = newW / fullElement.width
    let nh = newH / fullElement.height

    // Clamp
    nx = Math.max(0, Math.min(nx, 1))
    ny = Math.max(0, Math.min(ny, 1))
    nw = Math.max(0.01, Math.min(nw, 1 - nx))
    nh = Math.max(0.01, Math.min(nh, 1 - ny))

    setLocalCrop({ x: nx, y: ny, width: nw, height: nh })
  }

  // Listen for custom events from TopToolbar
  useEffect(() => {
    const onApply = () => handleApply()
    const onCancel = () => handleCancel()
    window.addEventListener('crop-apply', onApply)
    window.addEventListener('crop-cancel', onCancel)
    return () => {
      window.removeEventListener('crop-apply', onApply)
      window.removeEventListener('crop-cancel', onCancel)
    }
  }, [handleApply, handleCancel])

  if (!image || !image.naturalWidth || !image.naturalHeight) {
    return (
      <Group>
        <Rect
          x={fullElement.x}
          y={fullElement.y}
          width={fullElement.width}
          height={fullElement.height}
          fill="rgba(255, 0, 0, 0.5)"
        />
        {/* We can't render text in react-konva without Text node, let's just render a red rect to prove it's mounted */}
      </Group>
    )
  }

  return (
    <Group>
      {/* Dimmed Full Image */}
      <KonvaImage
        image={image}
        x={fullElement.x || 0}
        y={fullElement.y || 0}
        width={Math.max(1, fullElement.width || 1)}
        height={Math.max(1, fullElement.height || 1)}
        rotation={fullElement.rotation || 0}
        opacity={0.3}
      />

      {/* Cropped area fully opaque (using native crop) */}
      <KonvaImage
        image={image}
        x={cropRectX || 0}
        y={cropRectY || 0}
        width={Math.max(1, cropRectWidth || 1)}
        height={Math.max(1, cropRectHeight || 1)}
        rotation={fullElement.rotation || 0}
        crop={{
          x: Math.max(0, localCrop.x * image.naturalWidth || 0),
          y: Math.max(0, localCrop.y * image.naturalHeight || 0),
          width: Math.max(1, localCrop.width * image.naturalWidth || 1),
          height: Math.max(1, localCrop.height * image.naturalHeight || 1),
        }}
        opacity={1}
      />

      {/* Invisible Rect for Interaction */}
      <Rect
        ref={rectRef}
        x={cropRectX || 0}
        y={cropRectY || 0}
        width={Math.max(1, cropRectWidth || 1)}
        height={Math.max(1, cropRectHeight || 1)}
        draggable
        onDragMove={handleDragOrTransform}
        onTransform={handleDragOrTransform}
      />

      {/* Transformer for Crop Area */}
      <Transformer
        ref={trRef}
        boundBoxFunc={(oldBox, newBox) => {
          // Limit minimum size
          if (newBox.width < 20 || newBox.height < 20) {
            return oldBox
          }
          return newBox
        }}
        rotateEnabled={false}
        ignoreStroke
        keepRatio={false}
      />
    </Group>
  )
}

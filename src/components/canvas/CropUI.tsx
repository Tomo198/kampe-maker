import React, { useEffect, useRef, useState } from 'react'
import { Group, Rect, Image as KonvaImage, Transformer } from 'react-konva'
import type Konva from 'konva'
import type { ImageElement } from '../../models/element'
import { useProjectStore } from '../../store/projectStore'
import { useEditorStore } from '../../store/editorStore'
import { FULL_CROP, type NormalizedCrop } from '../../models/crop'
import { calculateCroppedElement } from '../../utils/crop'
import { useObjectURL } from '../../features/assets/useObjectURL'

type Props = {
  element: ImageElement
}

export const CropUI: React.FC<Props> = ({ element }) => {
  const updateElement = useProjectStore((s) => s.updateElement)
  const setCropMode = useEditorStore((s) => s.setCropMode)
  const project = useProjectStore((s) => s.project)
  const [localCrop, setLocalCrop] = useState<NormalizedCrop>(element.crop)

  const previewKey = React.useMemo(() => {
    if (!project) return null
    const asset = project.assets.find((a) => a.id === element.assetId)
    return asset ? asset.previewBlobKey : null
  }, [project, element.assetId])

  const objectUrl = useObjectURL(previewKey)
  const [image, setImage] = useState<HTMLImageElement | null>(null)

  useEffect(() => {
    if (!objectUrl) return
    let isMounted = true
    const img = new Image()
    img.onload = () => {
      if (isMounted) setImage(img)
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

  // Keybindings for Enter (Apply) and Escape (Cancel)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        const newElement = calculateCroppedElement(fullElement, localCrop)
        updateElement(element.id, {
          crop: localCrop,
          x: newElement.x,
          y: newElement.y,
          width: newElement.width,
          height: newElement.height,
        })
        setCropMode(null)
      } else if (e.key === 'Escape') {
        e.preventDefault()
        setCropMode(null) // Cancel
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [localCrop, element, fullElement, updateElement, setCropMode])

  if (!image) return null

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

  return (
    <Group>
      {/* Dimmed Full Image */}
      <KonvaImage
        image={image}
        x={fullElement.x}
        y={fullElement.y}
        width={fullElement.width}
        height={fullElement.height}
        rotation={fullElement.rotation}
        opacity={0.3}
      />

      {/* Cropped area fully opaque (using native crop) */}
      <KonvaImage
        image={image}
        x={cropRectX}
        y={cropRectY}
        width={cropRectWidth}
        height={cropRectHeight}
        rotation={fullElement.rotation}
        crop={{
          x: localCrop.x * image.naturalWidth,
          y: localCrop.y * image.naturalHeight,
          width: localCrop.width * image.naturalWidth,
          height: localCrop.height * image.naturalHeight,
        }}
        opacity={1}
      />

      {/* Invisible Rect for Interaction */}
      <Rect
        ref={rectRef}
        x={cropRectX}
        y={cropRectY}
        width={cropRectWidth}
        height={cropRectHeight}
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

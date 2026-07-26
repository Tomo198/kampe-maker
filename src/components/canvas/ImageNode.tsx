import React, { useEffect, useRef, useState } from 'react'
import { Image as KonvaImage } from 'react-konva'
import type Konva from 'konva'
import { useObjectURL } from '../../features/assets/useObjectURL'
import type { ImageElement } from '../../models/element'
import { useProjectStore } from '../../store/projectStore'
import { getPixelCrop } from '../../utils/crop'

type Props = {
  element: ImageElement
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSelect: (e: any) => void
  onChange: (updates: Partial<ImageElement>) => void
  isCropModeActive?: boolean
  onDragStart?: (e: Konva.KonvaEventObject<DragEvent>) => void
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void
}

export const ImageNode: React.FC<Props> = ({
  element,
  onSelect,
  onChange,
  isCropModeActive,
  onDragStart,
  onDragMove,
  onDragEnd,
}) => {
  const shapeRef = useRef<Konva.Image>(null)
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const project = useProjectStore((s) => s.project)
  const previewKey = React.useMemo(() => {
    if (!project) return null
    const asset = project.assets.find((a) => a.id === element.assetId)
    return asset ? asset.previewBlobKey : null
  }, [project, element.assetId])

  const objectUrl = useObjectURL(previewKey)

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

  // If crop is needed
  const cropArgs = React.useMemo(() => {
    if (!image || !image.naturalWidth || !image.naturalHeight || !element.crop) return undefined
    if (
      element.crop.width === 1 &&
      element.crop.height === 1 &&
      element.crop.x === 0 &&
      element.crop.y === 0
    )
      return undefined

    return getPixelCrop(element.crop, image.naturalWidth, image.naturalHeight)
  }, [image, element.crop])

  return (
    <KonvaImage
      id={element.id}
      name="element"
      image={image || undefined}
      ref={shapeRef}
      x={element.x}
      y={element.y}
      width={element.width}
      height={element.height}
      rotation={element.rotation}
      opacity={element.opacity}
      cornerRadius={element.cornerRadius}
      draggable={!element.locked && !isCropModeActive}
      crop={cropArgs}
      onMouseDown={onSelect}
      onTap={onSelect}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={(e) => {
        if (onDragEnd) {
          onDragEnd(e)
        } else {
          onChange({
            x: e.target.x(),
            y: e.target.y(),
          })
        }
      }}
    />
  )
}

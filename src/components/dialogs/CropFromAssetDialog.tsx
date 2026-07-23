import React, { useEffect, useRef, useState } from 'react'
import { Stage, Layer, Image as KonvaImage, Rect, Transformer, Group } from 'react-konva'
import type Konva from 'konva'
import { useObjectURL } from '../../features/assets/useObjectURL'
import type { Asset } from '../../models/asset'
import type { NormalizedCrop } from '../../models/crop'
import { useProjectStore } from '../../store/projectStore'

type Props = {
  asset: Asset
  onClose: () => void
}

export const CropFromAssetDialog: React.FC<Props> = ({ asset, onClose }) => {
  const objectUrl = useObjectURL(asset.previewBlobKey)
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [crop, setCrop] = useState<NormalizedCrop>({ x: 0, y: 0, width: 1, height: 1 })

  const project = useProjectStore((s) => s.project)
  const addElement = useProjectStore((s) => s.addElement)

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

  const rectRef = useRef<Konva.Rect>(null)
  const trRef = useRef<Konva.Transformer>(null)

  useEffect(() => {
    if (trRef.current && rectRef.current && image) {
      trRef.current.nodes([rectRef.current])
      trRef.current.getLayer()?.batchDraw()
    }
  }, [image])

  const handleAdd = () => {
    if (!project || !image) return
    const { width: canvasW, height: canvasH } = project.canvas

    const cropW = crop.width * image.naturalWidth
    const cropH = crop.height * image.naturalHeight
    const ratio = cropW / cropH

    // Scale to fit 60% of canvas
    const maxW = canvasW * 0.6
    const maxH = canvasH * 0.6

    let finalW = cropW
    let finalH = cropH

    if (finalW > maxW) {
      finalW = maxW
      finalH = finalW / ratio
    }
    if (finalH > maxH) {
      finalH = maxH
      finalW = finalH * ratio
    }

    // Offset slightly for multiple additions
    const offset = Math.floor(Math.random() * 20) - 10
    const x = (canvasW - finalW) / 2 + offset
    const y = (canvasH - finalH) / 2 + offset

    addElement({
      id: crypto.randomUUID(),
      type: 'image',
      name: `${asset.name} (一部)`,
      assetId: asset.id,
      crop: { ...crop },
      x,
      y,
      width: finalW,
      height: finalH,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      cornerRadius: 0,
    })
  }

  const handleTransform = () => {
    if (!rectRef.current || !image) return
    const node = rectRef.current
    const scaleX = node.scaleX()
    const scaleY = node.scaleY()

    node.scaleX(1)
    node.scaleY(1)

    const newW = node.width() * scaleX
    const newH = node.height() * scaleY

    const scale = Math.min(600 / image.naturalWidth, 400 / image.naturalHeight)

    let nx = node.x() / (image.naturalWidth * scale)
    let ny = node.y() / (image.naturalHeight * scale)
    let nw = newW / (image.naturalWidth * scale)
    let nh = newH / (image.naturalHeight * scale)

    nx = Math.max(0, Math.min(nx, 1))
    ny = Math.max(0, Math.min(ny, 1))
    nw = Math.max(0.01, Math.min(nw, 1 - nx))
    nh = Math.max(0.01, Math.min(nh, 1 - ny))

    setCrop({ x: nx, y: ny, width: nw, height: nh })
  }

  if (!image) {
    return (
      <div style={styles.overlay}>
        <div style={styles.dialog}>Loading...</div>
      </div>
    )
  }

  const scale = Math.min(600 / image.naturalWidth, 400 / image.naturalHeight)
  const stageW = image.naturalWidth * scale
  const stageH = image.naturalHeight * scale

  return (
    <div style={styles.overlay}>
      <div style={styles.dialog}>
        <h3 style={{ marginTop: 0 }}>切り抜いて追加</h3>
        <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
          必要な範囲を指定してください。
        </p>

        <div
          style={{
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-bg-canvas-outer)',
          }}
        >
          <Stage width={stageW} height={stageH}>
            <Layer>
              <Group scaleX={scale} scaleY={scale}>
                <KonvaImage image={image} opacity={0.3} />
                <KonvaImage
                  image={image}
                  crop={{
                    x: crop.x * image.naturalWidth,
                    y: crop.y * image.naturalHeight,
                    width: crop.width * image.naturalWidth,
                    height: crop.height * image.naturalHeight,
                  }}
                  x={crop.x * image.naturalWidth}
                  y={crop.y * image.naturalHeight}
                  width={crop.width * image.naturalWidth}
                  height={crop.height * image.naturalHeight}
                  opacity={1}
                />
              </Group>

              <Rect
                ref={rectRef}
                x={crop.x * stageW}
                y={crop.y * stageH}
                width={crop.width * stageW}
                height={crop.height * stageH}
                draggable
                onDragMove={handleTransform}
                onTransform={handleTransform}
              />
              <Transformer
                ref={trRef}
                rotateEnabled={false}
                ignoreStroke
                keepRatio={false}
                boundBoxFunc={(oldBox, newBox) => {
                  if (newBox.width < 20 || newBox.height < 20) return oldBox
                  return newBox
                }}
              />
            </Layer>
          </Stage>
        </div>

        <div style={{ marginTop: '16px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button style={styles.btnSecondary} onClick={onClose}>
            キャンセル
          </button>
          <button
            style={styles.btnPrimary}
            onClick={() => {
              handleAdd()
              onClose()
            }}
          >
            完了
          </button>
          <button
            style={styles.btnPrimary}
            onClick={() => {
              handleAdd()
            }}
          >
            この範囲を追加 (続けて切り抜く)
          </button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialog: {
    backgroundColor: 'var(--color-bg-surface)',
    padding: '24px',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-lg)',
  },
  btnPrimary: {
    padding: '8px 16px',
    backgroundColor: 'var(--color-accent-primary)',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  btnSecondary: {
    padding: '8px 16px',
    backgroundColor: 'var(--color-bg-secondary)',
    color: 'var(--color-text-primary)',
    border: '1px solid var(--color-border)',
    borderRadius: '4px',
    cursor: 'pointer',
  },
}

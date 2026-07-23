import Konva from 'konva'
import { db } from '../../db/database'
import type { Project } from '../../models/project'
import type {
  ImageElement,
  TextElement,
  StampElement,
  ShapeElement,
  BoxShapeElement,
  LineShapeElement,
} from '../../models/element'
import { getPixelCrop } from '../../utils/crop'

export async function renderProjectToCanvas(project: Project, maxEdge?: number): Promise<{ canvas: HTMLCanvasElement, stage: Konva.Stage }> {
  // Wait for all fonts to load
  await document.fonts.ready

  const { width, height, backgroundColor, transparent } = project.canvas

  const container = document.createElement('div')
  const stage = new Konva.Stage({
    container,
    width,
    height,
  })

  const layer = new Konva.Layer()
  stage.add(layer)

  // Background
  if (!transparent) {
    const bg = new Konva.Rect({
      x: 0,
      y: 0,
      width,
      height,
      fill: backgroundColor,
    })
    layer.add(bg)
  }

  // Draw Elements (Ordered by array index)
  for (const el of project.elements) {
    if (!el.visible) continue

    if (el.type === 'image') {
      const imgEl = el as ImageElement
      const asset = project.assets.find((a) => a.id === imgEl.assetId)
      if (!asset) continue

      // Use original blob for export if available
      const blobKey = asset.originalBlobKey || asset.previewBlobKey
      const blobRecord = await db.blobs.get(blobKey)
      if (!blobRecord) continue

      const img = new Image()
      const objectUrl = URL.createObjectURL(blobRecord.blob)

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('Failed to load image for export'))
        img.src = objectUrl
      })
      URL.revokeObjectURL(objectUrl)

      const konvaImg = new Konva.Image({
        x: imgEl.x,
        y: imgEl.y,
        width: imgEl.width,
        height: imgEl.height,
        image: img,
        rotation: imgEl.rotation,
        opacity: imgEl.opacity,
        cornerRadius: imgEl.cornerRadius,
      })

      // Crop logic
      if (
        imgEl.crop &&
        (imgEl.crop.width < 1 || imgEl.crop.height < 1 || imgEl.crop.x > 0 || imgEl.crop.y > 0)
      ) {
        konvaImg.crop(getPixelCrop(imgEl.crop, img.naturalWidth, img.naturalHeight))
      }

      layer.add(konvaImg)
    }

    if (el.type === 'text') {
      const textEl = el as TextElement
      const group = new Konva.Label({
        x: textEl.x,
        y: textEl.y,
        rotation: textEl.rotation,
        opacity: textEl.opacity,
      })
      group.add(
        new Konva.Tag({
          fill: textEl.backgroundColor || 'transparent',
          cornerRadius: textEl.cornerRadius,
        }),
      )
      group.add(
        new Konva.Text({
          text: textEl.text,
          fontFamily: textEl.fontFamily,
          fontSize: textEl.fontSize,
          fontStyle: textEl.fontWeight === 700 ? 'bold' : 'normal',
          fill: textEl.textColor,
          align: textEl.align,
          lineHeight: textEl.lineHeight,
          padding: textEl.padding,
          width: textEl.width,
        }),
      )
      layer.add(group)
    }

    if (el.type === 'stamp') {
      const stampEl = el as StampElement
      const group = new Konva.Group({
        x: stampEl.x,
        y: stampEl.y,
        rotation: stampEl.rotation,
        opacity: stampEl.opacity,
      })
      group.add(
        new Konva.Rect({
          width: stampEl.width,
          height: stampEl.height,
          fill: stampEl.backgroundColor,
          stroke: stampEl.borderColor,
          strokeWidth: stampEl.borderColor ? 2 : 0,
          cornerRadius: stampEl.cornerRadius,
        }),
      )
      if (stampEl.text) {
        group.add(
          new Konva.Text({
            text: stampEl.text,
            fill: stampEl.textColor,
            fontSize: stampEl.height * 0.55,
            fontFamily: 'Noto Sans JP',
            fontStyle: 'bold',
            align: 'center',
            verticalAlign: 'middle',
            width: stampEl.width,
            height: stampEl.height,
            padding: stampEl.height * 0.1,
          }),
        )
      }
      layer.add(group)
    }

    if (el.type === 'shape') {
      const shapeEl = el as ShapeElement
      const common = {
        x: shapeEl.x,
        y: shapeEl.y,
        rotation: shapeEl.rotation,
        opacity: shapeEl.opacity,
        stroke: shapeEl.strokeColor,
        strokeWidth: shapeEl.strokeWidth,
      }

      if (shapeEl.shapeType === 'rectangle') {
        const box = shapeEl as BoxShapeElement
        layer.add(
          new Konva.Rect({
            ...common,
            width: box.width,
            height: box.height,
            fill: box.fillColor,
          }),
        )
      } else if (shapeEl.shapeType === 'ellipse') {
        const box = shapeEl as BoxShapeElement
        layer.add(
          new Konva.Ellipse({
            ...common,
            radiusX: box.width / 2,
            radiusY: box.height / 2,
            fill: box.fillColor,
            offsetX: -box.width / 2,
            offsetY: -box.height / 2,
          }),
        )
      } else if (shapeEl.shapeType === 'line') {
        const line = shapeEl as LineShapeElement
        layer.add(
          new Konva.Line({
            ...common,
            points: line.points,
          }),
        )
      } else if (shapeEl.shapeType === 'arrow') {
        const line = shapeEl as LineShapeElement
        layer.add(
          new Konva.Arrow({
            ...common,
            points: line.points,
            fill: line.strokeColor,
            pointerLength: line.strokeWidth * 3,
            pointerWidth: line.strokeWidth * 3,
          }),
        )
      }
    }
  }

  // Force draw
  layer.draw()

  // Calculate pixel ratio if maxEdge is provided
  let pixelRatio = 1
  if (maxEdge) {
    const largest = Math.max(width, height)
    if (largest > maxEdge) {
      pixelRatio = maxEdge / largest
    }
  }

  // Export using toCanvas
  const canvas = stage.toCanvas({ pixelRatio })

  return { canvas, stage }
}

export async function exportToPNG(project: Project): Promise<void> {
  const { canvas, stage } = await renderProjectToCanvas(project)

  return new Promise<void>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Blob generation failed'))
        return
      }

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${project.name || 'kampe'}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      stage.destroy()
      resolve()
    }, 'image/png')
  })
}

export async function exportToBlob(project: Project, options: { maxEdge?: number, mimeType: string }): Promise<Blob> {
  const { canvas, stage } = await renderProjectToCanvas(project, options.maxEdge)

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      stage.destroy()
      if (!blob) {
        reject(new Error('Blob generation failed'))
        return
      }
      resolve(blob)
    }, options.mimeType)
  })
}

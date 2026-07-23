import type { CanvasElement } from '../models/element'
import { getElementWidth, getElementHeight } from './alignment'

export const SNAP_THRESHOLD = 6

export type GuideLine = {
  axis: 'x' | 'y'
  position: number
  start: number
  end: number
}

type SnapResult = {
  snappedX: number
  snappedY: number
  guides: GuideLine[]
}

// Generate all possible snap lines from candidates
function getSnapLines(elements: CanvasElement[], ignoreIds: string[]) {
  const xLines: { pos: number; extent: [number, number] }[] = []
  const yLines: { pos: number; extent: [number, number] }[] = []

  for (const el of elements) {
    if (ignoreIds.includes(el.id)) continue
    if (!el.visible || el.locked) continue

    const w = getElementWidth(el)
    const h = getElementHeight(el)

    // Vertical lines (x)
    xLines.push({ pos: el.x, extent: [el.y, el.y + h] })
    xLines.push({ pos: el.x + w / 2, extent: [el.y, el.y + h] })
    xLines.push({ pos: el.x + w, extent: [el.y, el.y + h] })

    // Horizontal lines (y)
    yLines.push({ pos: el.y, extent: [el.x, el.x + w] })
    yLines.push({ pos: el.y + h / 2, extent: [el.x, el.x + w] })
    yLines.push({ pos: el.y + h, extent: [el.x, el.x + w] })
  }

  return { xLines, yLines }
}

export function calculateSnap(
  movingElementBbox: { x: number; y: number; width: number; height: number },
  allElements: CanvasElement[],
  ignoreIds: string[],
  canvasWidth: number,
  canvasHeight: number,
  snapEnabled: boolean,
  isAltPressed: boolean, // Alt disables snapping on PC
): SnapResult {
  const effectiveSnapEnabled = snapEnabled && !isAltPressed

  if (!effectiveSnapEnabled) {
    return { snappedX: movingElementBbox.x, snappedY: movingElementBbox.y, guides: [] }
  }

  const { xLines, yLines } = getSnapLines(allElements, ignoreIds)

  // Add canvas bounds as snap lines
  xLines.push({ pos: 0, extent: [0, canvasHeight] })
  xLines.push({ pos: canvasWidth / 2, extent: [0, canvasHeight] })
  xLines.push({ pos: canvasWidth, extent: [0, canvasHeight] })

  yLines.push({ pos: 0, extent: [0, canvasWidth] })
  yLines.push({ pos: canvasHeight / 2, extent: [0, canvasWidth] })
  yLines.push({ pos: canvasHeight, extent: [0, canvasWidth] })

  const movingX = [
    movingElementBbox.x,
    movingElementBbox.x + movingElementBbox.width / 2,
    movingElementBbox.x + movingElementBbox.width,
  ]
  const movingY = [
    movingElementBbox.y,
    movingElementBbox.y + movingElementBbox.height / 2,
    movingElementBbox.y + movingElementBbox.height,
  ]

  let bestDx = 0
  let bestDy = 0
  let minDx = Infinity
  let minDy = Infinity
  const activeGuides: GuideLine[] = []

  // Find best X snap
  let snappedXLine: number | null = null
  let extentX: [number, number] | null = null

  for (const mx of movingX) {
    for (const line of xLines) {
      const dist = line.pos - mx
      if (Math.abs(dist) < SNAP_THRESHOLD && Math.abs(dist) < Math.abs(minDx)) {
        minDx = dist
        bestDx = dist
        snappedXLine = line.pos
        extentX = line.extent
      }
    }
  }

  // Find best Y snap
  let snappedYLine: number | null = null
  let extentY: [number, number] | null = null

  for (const my of movingY) {
    for (const line of yLines) {
      const dist = line.pos - my
      if (Math.abs(dist) < SNAP_THRESHOLD && Math.abs(dist) < Math.abs(minDy)) {
        minDy = dist
        bestDy = dist
        snappedYLine = line.pos
        extentY = line.extent
      }
    }
  }

  const finalX = movingElementBbox.x + (minDx !== Infinity ? bestDx : 0)
  const finalY = movingElementBbox.y + (minDy !== Infinity ? bestDy : 0)

  if (snappedXLine !== null && extentX !== null) {
    activeGuides.push({
      axis: 'x',
      position: snappedXLine,
      start: Math.min(extentX[0], finalY),
      end: Math.max(extentX[1], finalY + movingElementBbox.height),
    })
  }

  if (snappedYLine !== null && extentY !== null) {
    activeGuides.push({
      axis: 'y',
      position: snappedYLine,
      start: Math.min(extentY[0], finalX),
      end: Math.max(extentY[1], finalX + movingElementBbox.width),
    })
  }

  return { snappedX: finalX, snappedY: finalY, guides: activeGuides }
}

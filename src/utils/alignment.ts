import type { CanvasElement } from '../models/element'

export type BoundingBox = {
  minX: number
  minY: number
  maxX: number
  maxY: number
  width: number
  height: number
}

export function getElementWidth(el: CanvasElement): number {
  if (el.type === 'shape' && (el.shapeType === 'line' || el.shapeType === 'arrow')) {
    return Math.abs(el.points[2] - el.points[0])
  }
  return 'width' in el ? (el as { width: number }).width : 0
}

export function getElementHeight(el: CanvasElement): number {
  if (el.type === 'shape' && (el.shapeType === 'line' || el.shapeType === 'arrow')) {
    return Math.abs(el.points[3] - el.points[1])
  }
  return 'height' in el ? (el as { height: number }).height : 0
}

// Calculate the bounding box for an array of elements
export function getBoundingBox(elements: CanvasElement[]): BoundingBox {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const el of elements) {
    const w = getElementWidth(el)
    const h = getElementHeight(el)
    if (el.x < minX) minX = el.x
    if (el.y < minY) minY = el.y
    if (el.x + w > maxX) maxX = el.x + w
    if (el.y + h > maxY) maxY = el.y + h
  }

  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY }
}

export type AlignAction =
  | 'left'
  | 'center'
  | 'right'
  | 'top'
  | 'middle'
  | 'bottom'
  | 'distribute-x'
  | 'distribute-y'
  | 'match-width'
  | 'match-height'
  | 'center-to-canvas'

// Calculate movements required for each element/group unit to achieve alignment
export function calculateAlignment(
  units: { id: string; elements: CanvasElement[]; bbox: BoundingBox; isGroup: boolean }[],
  action: AlignAction,
  canvasWidth: number,
  canvasHeight: number,
): {
  id: string
  dx: number
  dy: number
  newWidth?: number
  newHeight?: number
  isGroup: boolean
}[] {
  if (units.length === 0) return []

  const result: {
    id: string
    dx: number
    dy: number
    newWidth?: number
    newHeight?: number
    isGroup: boolean
  }[] = []

  // Overall bounding box of all selected units
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const u of units) {
    if (u.bbox.minX < minX) minX = u.bbox.minX
    if (u.bbox.minY < minY) minY = u.bbox.minY
    if (u.bbox.maxX > maxX) maxX = u.bbox.maxX
    if (u.bbox.maxY > maxY) maxY = u.bbox.maxY
  }
  const overallCenterX = (minX + maxX) / 2
  const overallCenterY = (minY + maxY) / 2

  if (action === 'center-to-canvas') {
    const dx = canvasWidth / 2 - overallCenterX
    const dy = canvasHeight / 2 - overallCenterY
    for (const u of units) {
      result.push({ id: u.id, dx, dy, isGroup: u.isGroup })
    }
    return result
  }

  if (action === 'left') {
    for (const u of units)
      result.push({ id: u.id, dx: minX - u.bbox.minX, dy: 0, isGroup: u.isGroup })
    return result
  }
  if (action === 'center') {
    for (const u of units)
      result.push({
        id: u.id,
        dx: overallCenterX - (u.bbox.minX + u.bbox.width / 2),
        dy: 0,
        isGroup: u.isGroup,
      })
    return result
  }
  if (action === 'right') {
    for (const u of units)
      result.push({ id: u.id, dx: maxX - u.bbox.maxX, dy: 0, isGroup: u.isGroup })
    return result
  }
  if (action === 'top') {
    for (const u of units)
      result.push({ id: u.id, dx: 0, dy: minY - u.bbox.minY, isGroup: u.isGroup })
    return result
  }
  if (action === 'middle') {
    for (const u of units)
      result.push({
        id: u.id,
        dx: 0,
        dy: overallCenterY - (u.bbox.minY + u.bbox.height / 2),
        isGroup: u.isGroup,
      })
    return result
  }
  if (action === 'bottom') {
    for (const u of units)
      result.push({ id: u.id, dx: 0, dy: maxY - u.bbox.maxY, isGroup: u.isGroup })
    return result
  }

  if (action === 'distribute-x' && units.length >= 3) {
    const sorted = [...units].sort((a, b) => a.bbox.minX - b.bbox.minX)
    const first = sorted[0]
    const last = sorted[sorted.length - 1]
    const totalWidth = last.bbox.maxX - first.bbox.minX
    const sumWidths = sorted.reduce((sum, u) => sum + u.bbox.width, 0)
    const space = (totalWidth - sumWidths) / (units.length - 1)

    let currentX = first.bbox.minX
    for (const u of sorted) {
      result.push({ id: u.id, dx: currentX - u.bbox.minX, dy: 0, isGroup: u.isGroup })
      currentX += u.bbox.width + space
    }
    return result
  }

  if (action === 'distribute-y' && units.length >= 3) {
    const sorted = [...units].sort((a, b) => a.bbox.minY - b.bbox.minY)
    const first = sorted[0]
    const last = sorted[sorted.length - 1]
    const totalHeight = last.bbox.maxY - first.bbox.minY
    const sumHeights = sorted.reduce((sum, u) => sum + u.bbox.height, 0)
    const space = (totalHeight - sumHeights) / (units.length - 1)

    let currentY = first.bbox.minY
    for (const u of sorted) {
      result.push({ id: u.id, dx: 0, dy: currentY - u.bbox.minY, isGroup: u.isGroup })
      currentY += u.bbox.height + space
    }
    return result
  }

  // match-width and match-height are applied directly to elements (groups skipped)
  if (action === 'match-width') {
    const maxWidth = Math.max(...units.map((u) => u.bbox.width))
    for (const u of units) {
      if (!u.isGroup && u.elements.length === 1) {
        // Rule 11: Ignore lines and arrows.
        const el = u.elements[0]
        if (el.type === 'shape' && (el.shapeType === 'line' || el.shapeType === 'arrow')) continue
        if (el.locked) continue
        result.push({ id: u.id, dx: 0, dy: 0, newWidth: maxWidth, isGroup: false })
      }
    }
    return result
  }

  if (action === 'match-height') {
    const maxHeight = Math.max(...units.map((u) => u.bbox.height))
    for (const u of units) {
      if (!u.isGroup && u.elements.length === 1) {
        const el = u.elements[0]
        if (el.type === 'shape' && (el.shapeType === 'line' || el.shapeType === 'arrow')) continue
        if (el.locked) continue
        result.push({ id: u.id, dx: 0, dy: 0, newHeight: maxHeight, isGroup: false })
      }
    }
    return result
  }

  return result
}

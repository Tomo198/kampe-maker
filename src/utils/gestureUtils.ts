export type Point = { x: number; y: number }

export function getDistance(p1: Point, p2: Point): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
}

export function getCenter(p1: Point, p2: Point): Point {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  }
}

export function calculateStandardPinch(
  p1: Point,
  p2: Point,
  lastCenter: Point | null,
  lastDistance: number,
  currentZoom: number,
  currentPan: Point,
  minZoom: number = 0.1,
  maxZoom: number = 5.0,
): { zoom: number; pan: Point; newCenter: Point; newDistance: number } {
  const newDistance = getDistance(p1, p2)
  const newCenter = getCenter(p1, p2)

  if (lastDistance === 0 || !lastCenter) {
    return { zoom: currentZoom, pan: currentPan, newCenter, newDistance }
  }

  const scaleBy = newDistance / lastDistance
  let newZoom = currentZoom * scaleBy
  newZoom = Math.max(minZoom, Math.min(maxZoom, newZoom))

  const pointTo = {
    x: (lastCenter.x - currentPan.x) / currentZoom,
    y: (lastCenter.y - currentPan.y) / currentZoom,
  }

  const newPan = {
    x: newCenter.x - pointTo.x * newZoom,
    y: newCenter.y - pointTo.y * newZoom,
  }

  return { zoom: newZoom, pan: newPan, newCenter, newDistance }
}

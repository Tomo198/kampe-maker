export function calculateAutoFit(
  containerWidth: number,
  containerHeight: number,
  canvasWidth: number,
  canvasHeight: number,
  paddingRatio: number = 0.05, // 5% padding on each side (10% total)
  minZoom: number = 0.1,
  maxZoom: number = 5.0,
): { zoom: number; pan: { x: number; y: number } } {
  if (containerWidth <= 0 || containerHeight <= 0 || canvasWidth <= 0 || canvasHeight <= 0) {
    return { zoom: 1, pan: { x: 0, y: 0 } }
  }

  const availableWidth = containerWidth * (1 - paddingRatio * 2)
  const availableHeight = containerHeight * (1 - paddingRatio * 2)

  const scaleX = availableWidth / canvasWidth
  const scaleY = availableHeight / canvasHeight

  let zoom = Math.min(scaleX, scaleY)
  zoom = Math.max(minZoom, Math.min(maxZoom, zoom))

  const panX = (containerWidth - canvasWidth * zoom) / 2
  const panY = (containerHeight - canvasHeight * zoom) / 2

  return {
    zoom,
    pan: { x: panX, y: panY },
  }
}

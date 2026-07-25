/**
 * Converts a logical canvas coordinate to a screen pixel coordinate relative to the canvas container.
 *
 * @param logicalVal - The logical coordinate value (x or y)
 * @param pan - The pan offset for that axis (pan.x or pan.y)
 * @param zoom - The current zoom level
 * @returns The screen coordinate
 */
export function logicalToScreen(logicalVal: number, pan: number, zoom: number): number {
  return logicalVal * zoom + pan
}

/**
 * Ensures a button overlay stays within the visible bounds of the canvas container.
 *
 * @param buttonX - The requested screen X coordinate
 * @param buttonY - The requested screen Y coordinate
 * @param buttonWidth - The width of the button
 * @param buttonHeight - The height of the button
 * @param containerWidth - The width of the canvas container
 * @param containerHeight - The height of the canvas container
 * @returns Clamped { x, y } screen coordinates
 */
export function clampOverlayPosition(
  buttonX: number,
  buttonY: number,
  buttonWidth: number,
  buttonHeight: number,
  containerWidth: number,
  containerHeight: number,
) {
  const padding = 10

  let x = buttonX
  let y = buttonY

  // Clamp X
  if (x < padding) {
    x = padding
  } else if (x + buttonWidth > containerWidth - padding) {
    x = containerWidth - padding - buttonWidth
  }

  // Clamp Y
  if (y < padding) {
    y = padding
  } else if (y + buttonHeight > containerHeight - padding) {
    y = containerHeight - padding - buttonHeight
  }

  return { x, y }
}

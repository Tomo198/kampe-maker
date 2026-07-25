import type { NormalizedCrop } from '../models/crop'
import type { ImageElement } from '../models/element'

/**
 * Converts NormalizedCrop (0 to 1) to actual pixel coordinates based on the source image size.
 */
export function getPixelCrop(crop: NormalizedCrop, imageWidth: number, imageHeight: number) {
  return {
    x: crop.x * imageWidth,
    y: crop.y * imageHeight,
    width: crop.width * imageWidth,
    height: crop.height * imageHeight,
  }
}

/**
 * Recalculates the element's position and size on the canvas when the crop changes,
 * maintaining the same visual scale and relative position of the image contents.
 */
export function calculateCroppedElement(
  element: ImageElement,
  newCrop: NormalizedCrop,
): ImageElement {
  const currentCrop =
    element.crop &&
    typeof element.crop.width === 'number' &&
    element.crop.width > 0 &&
    element.crop.height > 0
      ? element.crop
      : { x: 0, y: 0, width: 1, height: 1 }

  const fullDisplayWidth = element.width / currentCrop.width
  const fullDisplayHeight = element.height / currentCrop.height

  // Find the top-left coordinate of the "full" uncropped image on the canvas
  const fullX = element.x - currentCrop.x * fullDisplayWidth
  const fullY = element.y - currentCrop.y * fullDisplayHeight

  // Calculate new position and size based on the new crop
  return {
    ...element,
    crop: newCrop,
    width: newCrop.width * fullDisplayWidth,
    height: newCrop.height * fullDisplayHeight,
    x: fullX + newCrop.x * fullDisplayWidth,
    y: fullY + newCrop.y * fullDisplayHeight,
  }
}

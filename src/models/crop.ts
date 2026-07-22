export type NormalizedCrop = {
  x: number
  y: number
  width: number
  height: number
}

export type CropValidationError = {
  field: string
  message: string
  value: number
}

export function validateNormalizedCrop(crop: NormalizedCrop): CropValidationError[] {
  const errors: CropValidationError[] = []

  const checkFinite = (field: string, value: number) => {
    if (!Number.isFinite(value)) {
      errors.push({ field, message: `${field} must be a finite number`, value })
    }
  }

  checkFinite('x', crop.x)
  checkFinite('y', crop.y)
  checkFinite('width', crop.width)
  checkFinite('height', crop.height)

  if (errors.length > 0) return errors

  if (crop.x < 0 || crop.x > 1) {
    errors.push({ field: 'x', message: 'x must be between 0 and 1', value: crop.x })
  }
  if (crop.y < 0 || crop.y > 1) {
    errors.push({ field: 'y', message: 'y must be between 0 and 1', value: crop.y })
  }
  if (crop.width <= 0 || crop.width > 1) {
    errors.push({
      field: 'width',
      message: 'width must be greater than 0 and at most 1',
      value: crop.width,
    })
  }
  if (crop.height <= 0 || crop.height > 1) {
    errors.push({
      field: 'height',
      message: 'height must be greater than 0 and at most 1',
      value: crop.height,
    })
  }
  if (crop.x + crop.width > 1) {
    errors.push({
      field: 'x+width',
      message: 'x + width must be at most 1',
      value: crop.x + crop.width,
    })
  }
  if (crop.y + crop.height > 1) {
    errors.push({
      field: 'y+height',
      message: 'y + height must be at most 1',
      value: crop.y + crop.height,
    })
  }

  return errors
}

export function isValidNormalizedCrop(crop: NormalizedCrop): boolean {
  return validateNormalizedCrop(crop).length === 0
}

export const FULL_CROP: NormalizedCrop = {
  x: 0,
  y: 0,
  width: 1,
  height: 1,
}

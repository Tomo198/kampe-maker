import { describe, it, expect } from 'vitest'
import { validateNormalizedCrop, isValidNormalizedCrop, FULL_CROP } from './crop'
import type { NormalizedCrop } from './crop'

describe('validateNormalizedCrop', () => {
  it('accepts full crop (0,0,1,1)', () => {
    expect(validateNormalizedCrop(FULL_CROP)).toEqual([])
  })

  it('accepts left half crop', () => {
    const crop: NormalizedCrop = { x: 0, y: 0, width: 0.5, height: 1 }
    expect(validateNormalizedCrop(crop)).toEqual([])
  })

  it('accepts a small center crop', () => {
    const crop: NormalizedCrop = { x: 0.25, y: 0.25, width: 0.5, height: 0.5 }
    expect(validateNormalizedCrop(crop)).toEqual([])
  })

  it('accepts minimum valid crop at origin', () => {
    const crop: NormalizedCrop = { x: 0, y: 0, width: 0.001, height: 0.001 }
    expect(validateNormalizedCrop(crop)).toEqual([])
  })

  it('accepts crop at bottom-right corner', () => {
    const crop: NormalizedCrop = { x: 0.9, y: 0.9, width: 0.1, height: 0.1 }
    expect(validateNormalizedCrop(crop)).toEqual([])
  })

  // Boundary: x + width exactly 1
  it('accepts x + width = 1 exactly', () => {
    const crop: NormalizedCrop = { x: 0.5, y: 0, width: 0.5, height: 1 }
    expect(validateNormalizedCrop(crop)).toEqual([])
  })

  // Boundary: y + height exactly 1
  it('accepts y + height = 1 exactly', () => {
    const crop: NormalizedCrop = { x: 0, y: 0.3, width: 1, height: 0.7 }
    expect(validateNormalizedCrop(crop)).toEqual([])
  })

  // Error: x negative
  it('rejects negative x', () => {
    const crop: NormalizedCrop = { x: -0.1, y: 0, width: 0.5, height: 0.5 }
    const errors = validateNormalizedCrop(crop)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors.some((e) => e.field === 'x')).toBe(true)
  })

  // Error: y negative
  it('rejects negative y', () => {
    const crop: NormalizedCrop = { x: 0, y: -0.01, width: 0.5, height: 0.5 }
    const errors = validateNormalizedCrop(crop)
    expect(errors.some((e) => e.field === 'y')).toBe(true)
  })

  // Error: x > 1
  it('rejects x greater than 1', () => {
    const crop: NormalizedCrop = { x: 1.1, y: 0, width: 0.5, height: 0.5 }
    const errors = validateNormalizedCrop(crop)
    expect(errors.some((e) => e.field === 'x')).toBe(true)
  })

  // Error: width = 0
  it('rejects zero width', () => {
    const crop: NormalizedCrop = { x: 0, y: 0, width: 0, height: 0.5 }
    const errors = validateNormalizedCrop(crop)
    expect(errors.some((e) => e.field === 'width')).toBe(true)
  })

  // Error: negative width
  it('rejects negative width', () => {
    const crop: NormalizedCrop = { x: 0, y: 0, width: -0.5, height: 0.5 }
    const errors = validateNormalizedCrop(crop)
    expect(errors.some((e) => e.field === 'width')).toBe(true)
  })

  // Error: height = 0
  it('rejects zero height', () => {
    const crop: NormalizedCrop = { x: 0, y: 0, width: 0.5, height: 0 }
    const errors = validateNormalizedCrop(crop)
    expect(errors.some((e) => e.field === 'height')).toBe(true)
  })

  // Error: width > 1
  it('rejects width greater than 1', () => {
    const crop: NormalizedCrop = { x: 0, y: 0, width: 1.1, height: 0.5 }
    const errors = validateNormalizedCrop(crop)
    expect(errors.some((e) => e.field === 'width')).toBe(true)
  })

  // Error: x + width > 1
  it('rejects x + width exceeding 1', () => {
    const crop: NormalizedCrop = { x: 0.6, y: 0, width: 0.5, height: 0.5 }
    const errors = validateNormalizedCrop(crop)
    expect(errors.some((e) => e.field === 'x+width')).toBe(true)
  })

  // Error: y + height > 1
  it('rejects y + height exceeding 1', () => {
    const crop: NormalizedCrop = { x: 0, y: 0.6, width: 0.5, height: 0.5 }
    const errors = validateNormalizedCrop(crop)
    expect(errors.some((e) => e.field === 'y+height')).toBe(true)
  })

  // Non-finite values
  it('rejects NaN x', () => {
    const crop: NormalizedCrop = { x: NaN, y: 0, width: 0.5, height: 0.5 }
    const errors = validateNormalizedCrop(crop)
    expect(errors.some((e) => e.field === 'x')).toBe(true)
  })

  it('rejects Infinity width', () => {
    const crop: NormalizedCrop = { x: 0, y: 0, width: Infinity, height: 0.5 }
    const errors = validateNormalizedCrop(crop)
    expect(errors.some((e) => e.field === 'width')).toBe(true)
  })

  it('rejects -Infinity height', () => {
    const crop: NormalizedCrop = { x: 0, y: 0, width: 0.5, height: -Infinity }
    const errors = validateNormalizedCrop(crop)
    expect(errors.some((e) => e.field === 'height')).toBe(true)
  })

  // Multiple errors at once
  it('returns multiple errors for multiple violations', () => {
    const crop: NormalizedCrop = { x: -0.1, y: -0.1, width: 0, height: 1.5 }
    const errors = validateNormalizedCrop(crop)
    expect(errors.length).toBeGreaterThanOrEqual(3)
  })
})

describe('isValidNormalizedCrop', () => {
  it('returns true for valid crop', () => {
    expect(isValidNormalizedCrop(FULL_CROP)).toBe(true)
  })

  it('returns false for invalid crop', () => {
    expect(isValidNormalizedCrop({ x: -1, y: 0, width: 0.5, height: 0.5 })).toBe(false)
  })
})

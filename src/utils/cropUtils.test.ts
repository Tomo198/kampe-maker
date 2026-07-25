import { describe, it, expect } from 'vitest'
import { logicalToScreen, clampOverlayPosition } from './cropUtils'

describe('cropUtils', () => {
  describe('logicalToScreen', () => {
    it('calculates correctly with pan and zoom', () => {
      expect(logicalToScreen(100, 50, 2)).toBe(250) // 100 * 2 + 50
      expect(logicalToScreen(0, -10, 1)).toBe(-10)
    })
  })

  describe('clampOverlayPosition', () => {
    it('clamps to the left edge with padding', () => {
      const res = clampOverlayPosition(-50, 100, 200, 44, 800, 600)
      expect(res.x).toBe(10)
      expect(res.y).toBe(100)
    })

    it('clamps to the right edge with padding', () => {
      const res = clampOverlayPosition(700, 100, 200, 44, 800, 600)
      // containerWidth = 800, btnW = 200. Max X = 800 - 10 - 200 = 590
      expect(res.x).toBe(590)
    })

    it('clamps to the top edge with padding', () => {
      const res = clampOverlayPosition(100, -20, 200, 44, 800, 600)
      expect(res.y).toBe(10)
    })

    it('clamps to the bottom edge with padding', () => {
      const res = clampOverlayPosition(100, 580, 200, 44, 800, 600)
      // containerHeight = 600, btnH = 44. Max Y = 600 - 10 - 44 = 546
      expect(res.y).toBe(546)
    })

    it('keeps position if within bounds', () => {
      const res = clampOverlayPosition(100, 100, 200, 44, 800, 600)
      expect(res.x).toBe(100)
      expect(res.y).toBe(100)
    })
  })
})

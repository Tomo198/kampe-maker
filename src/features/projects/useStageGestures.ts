import { useState, useRef } from 'react'
import type { KonvaEventObject } from 'konva/lib/Node'
import { calculateStandardPinch } from '../../utils/gestureUtils'
import type { Point } from '../../utils/gestureUtils'

export function useStageGestures(
  zoom: number,
  setZoom: (zoom: number) => void,
  pan: Point,
  setPan: (pan: Point) => void,
  setViewportManuallyAdjusted: (adj: boolean) => void,
) {
  const [isPinching, setIsPinching] = useState(false)
  const lastCenter = useRef<Point | null>(null)
  const lastDistance = useRef<number>(0)

  const onTouchStart = (e: KonvaEventObject<TouchEvent>) => {
    const touch1 = e.evt.touches[0]
    const touch2 = e.evt.touches[1]

    if (touch1 && touch2) {
      setIsPinching(true)
      const p1 = { x: touch1.clientX, y: touch1.clientY }
      const p2 = { x: touch2.clientX, y: touch2.clientY }

      const res = calculateStandardPinch(p1, p2, null, 0, zoom, pan)
      lastCenter.current = res.newCenter
      lastDistance.current = res.newDistance
    }
  }

  const onTouchMove = (e: KonvaEventObject<TouchEvent>) => {
    const touch1 = e.evt.touches[0]
    const touch2 = e.evt.touches[1]

    if (touch1 && touch2 && isPinching) {
      e.evt.preventDefault() // prevent native scrolling only when pinching
      const p1 = { x: touch1.clientX, y: touch1.clientY }
      const p2 = { x: touch2.clientX, y: touch2.clientY }

      const res = calculateStandardPinch(
        p1,
        p2,
        lastCenter.current,
        lastDistance.current,
        zoom,
        pan,
      )

      setViewportManuallyAdjusted(true)
      setZoom(res.zoom)
      setPan(res.pan)

      lastCenter.current = res.newCenter
      lastDistance.current = res.newDistance
    }
  }

  const onTouchEnd = (e: KonvaEventObject<TouchEvent>) => {
    if (e.evt.touches.length < 2) {
      setIsPinching(false)
      lastCenter.current = null
      lastDistance.current = 0
    }
  }

  return {
    isPinching,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  }
}

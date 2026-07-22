import { useRef, useCallback, useEffect, useState } from 'react'
import { Stage, Layer, Rect } from 'react-konva'
import { useUIStore } from '../../store/uiStore'
import { DEFAULT_CANVAS_PRESET } from '../../constants/canvas'
import './CanvasArea.css'

export function CanvasArea() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  const zoomLevel = useUIStore((s) => s.zoomLevel)

  const canvasWidth = DEFAULT_CANVAS_PRESET.width
  const canvasHeight = DEFAULT_CANVAS_PRESET.height

  const updateSize = useCallback(() => {
    if (containerRef.current) {
      setContainerSize({
        width: containerRef.current.offsetWidth,
        height: containerRef.current.offsetHeight,
      })
    }
  }, [])

  useEffect(() => {
    updateSize()
    const observer = new ResizeObserver(updateSize)
    if (containerRef.current) {
      observer.observe(containerRef.current)
    }
    return () => observer.disconnect()
  }, [updateSize])

  // Calculate scale to fit canvas in container with padding
  const padding = 40
  const availableWidth = containerSize.width - padding * 2
  const availableHeight = containerSize.height - padding * 2
  const fitScale = Math.min(availableWidth / canvasWidth, availableHeight / canvasHeight, 1)
  const scale = fitScale * zoomLevel

  // Center the canvas
  const offsetX = (containerSize.width - canvasWidth * scale) / 2
  const offsetY = (containerSize.height - canvasHeight * scale) / 2

  return (
    <div className="canvas-area" ref={containerRef}>
      {containerSize.width > 0 && containerSize.height > 0 && (
        <Stage
          width={containerSize.width}
          height={containerSize.height}
          scaleX={scale}
          scaleY={scale}
          x={offsetX}
          y={offsetY}
        >
          <Layer>
            {/* Canvas background */}
            <Rect
              x={0}
              y={0}
              width={canvasWidth}
              height={canvasHeight}
              fill="#ffffff"
              shadowColor="rgba(0,0,0,0.3)"
              shadowBlur={20}
              shadowOffsetX={0}
              shadowOffsetY={4}
              shadowEnabled
            />
          </Layer>
        </Stage>
      )}
    </div>
  )
}

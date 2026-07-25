import React, { useRef } from 'react'
import { Rect, Ellipse, Line, Arrow } from 'react-konva'
import type Konva from 'konva'
import type { ShapeElement, BoxShapeElement, LineShapeElement } from '../../models/element'

type Props = {
  element: ShapeElement
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSelect: (e: any) => void
  onChange: (updates: Partial<ShapeElement>) => void
  onDragStart?: (e: Konva.KonvaEventObject<DragEvent>) => void
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void
}

export const ShapeNode: React.FC<Props> = ({
  element,
  onSelect,
  onChange,
  onDragStart,
  onDragMove,
  onDragEnd,
}) => {
  const shapeRef = useRef<Konva.Shape>(null)

  const handleTransformEnd = (e: Konva.KonvaEventObject<Event>) => {
    const node = e.target
    const scaleX = node.scaleX()
    const scaleY = node.scaleY()

    // We reset scale to 1 and update width/height or points instead
    node.scaleX(1)
    node.scaleY(1)

    if (element.shapeType === 'rectangle' || element.shapeType === 'ellipse') {
      const box = element as BoxShapeElement
      onChange({
        x: node.x(),
        y: node.y(),
        width: Math.max(5, box.width * scaleX),
        height: Math.max(5, box.height * scaleY),
        rotation: node.rotation(),
      })
    } else {
      const line = element as LineShapeElement
      const newPoints = [
        line.points[0] * scaleX,
        line.points[1] * scaleY,
        line.points[2] * scaleX,
        line.points[3] * scaleY,
      ] as [number, number, number, number]

      onChange({
        x: node.x(),
        y: node.y(),
        points: newPoints,
        rotation: node.rotation(),
      })
    }
  }

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    onChange({
      x: e.target.x(),
      y: e.target.y(),
    })
  }

  const commonProps = {
    id: element.id,
    name: 'element',
    x: element.x,
    y: element.y,
    rotation: element.rotation,
    opacity: element.opacity,
    draggable: !element.locked,
    onMouseDown: onSelect,
    onTap: onSelect,
    onDragStart,
    onDragMove,
    onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => {
      if (onDragEnd) {
        onDragEnd(e)
      } else {
        handleDragEnd(e)
      }
    },
    onTransformEnd: handleTransformEnd,
    stroke: element.strokeColor,
    strokeWidth: element.strokeWidth,
  }

  switch (element.shapeType) {
    case 'rectangle':
      return (
        <Rect
          {...commonProps}
          ref={shapeRef as React.RefObject<Konva.Rect>}
          width={element.width}
          height={element.height}
          fill={element.fillColor}
        />
      )
    case 'ellipse':
      return (
        <Ellipse
          {...commonProps}
          ref={shapeRef as React.RefObject<Konva.Ellipse>}
          radiusX={element.width / 2}
          radiusY={element.height / 2}
          fill={element.fillColor}
          // Konva Ellipse expects width/height to be double the radius,
          // but we can also position via offset so x,y is top-left like Rect.
          // By default Konva Ellipse x,y is the center. We adjust offset:
          offsetX={-element.width / 2}
          offsetY={-element.height / 2}
        />
      )
    case 'line':
      return (
        <Line
          {...commonProps}
          ref={shapeRef as React.RefObject<Konva.Line>}
          points={element.points}
          hitStrokeWidth={Math.max(20, element.strokeWidth)} // Easier to click
        />
      )
    case 'arrow':
      return (
        <Arrow
          {...commonProps}
          ref={shapeRef as React.RefObject<Konva.Arrow>}
          points={element.points}
          fill={element.strokeColor} // Arrow head is filled with stroke color
          pointerLength={element.strokeWidth * 3}
          pointerWidth={element.strokeWidth * 3}
          hitStrokeWidth={Math.max(20, element.strokeWidth)}
        />
      )
    default:
      return null
  }
}

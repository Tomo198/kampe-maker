import React, { useRef } from 'react'
import { Group, Rect, Text } from 'react-konva'
import type Konva from 'konva'
import type { StampElement } from '../../models/element'

type Props = {
  element: StampElement
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSelect: (e: any) => void
  onChange: (updates: Partial<StampElement>) => void
  onDragStart?: (e: Konva.KonvaEventObject<DragEvent>) => void
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void
}

export const StampNode: React.FC<Props> = ({
  element,
  onSelect,
  onChange,
  onDragStart,
  onDragMove,
  onDragEnd,
}) => {
  const groupRef = useRef<Konva.Group>(null)

  const handleTransformEnd = () => {
    const node = groupRef.current
    if (!node) return

    const scaleX = node.scaleX()
    const scaleY = node.scaleY()

    // Reset scale to 1
    node.scaleX(1)
    node.scaleY(1)

    onChange({
      x: node.x(),
      y: node.y(),
      width: Math.max(10, element.width * scaleX),
      height: Math.max(10, element.height * scaleY),
      rotation: node.rotation(),
    })
  }

  // Calculate dynamic font size based on height
  const fontSize = element.height * 0.55
  const padding = element.height * 0.1

  return (
    <Group
      ref={groupRef}
      id={element.id}
      name="element"
      x={element.x}
      y={element.y}
      rotation={element.rotation}
      opacity={element.opacity}
      draggable={!element.locked}
      onMouseDown={onSelect}
      onTap={onSelect}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={(e) => {
        if (onDragEnd) {
          onDragEnd(e)
        } else {
          onChange({ x: e.target.x(), y: e.target.y() })
        }
      }}
      onTransformEnd={handleTransformEnd}
    >
      <Rect
        width={element.width}
        height={element.height}
        fill={element.backgroundColor}
        stroke={element.borderColor}
        strokeWidth={element.borderColor ? 2 : 0}
        cornerRadius={element.cornerRadius}
      />
      {element.text && (
        <Text
          text={element.text}
          fill={element.textColor}
          fontSize={fontSize}
          fontFamily="Noto Sans JP"
          fontStyle="bold"
          align="center"
          verticalAlign="middle"
          width={element.width}
          height={element.height}
          padding={padding}
        />
      )}
    </Group>
  )
}

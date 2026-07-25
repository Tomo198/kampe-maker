import React, { useRef, useEffect } from 'react'
import { Label, Tag, Text } from 'react-konva'
import type Konva from 'konva'
import type { TextElement } from '../../models/element'

type Props = {
  element: TextElement
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSelect: (e: any) => void
  onChange: (updates: Partial<TextElement>) => void
  onDragStart?: (e: Konva.KonvaEventObject<DragEvent>) => void
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void
}

export const TextNode: React.FC<Props> = ({
  element,
  onSelect,
  onChange,
  onDragStart,
  onDragMove,
  onDragEnd,
}) => {
  const labelRef = useRef<Konva.Label>(null)
  const textRef = useRef<Konva.Text>(null)

  const handleTransformEnd = () => {
    const node = labelRef.current
    const textNode = textRef.current
    if (!node || !textNode) return

    const scaleX = node.scaleX()

    // Reset scale to 1
    node.scaleX(1)
    node.scaleY(1)

    // Apply scale to width
    const newWidth = Math.max(20, element.width * scaleX)

    // Update text width to compute new height
    textNode.width(newWidth)
    const newHeight = textNode.height()

    onChange({
      x: node.x(),
      y: node.y(),
      width: newWidth,
      height: newHeight,
      rotation: node.rotation(),
    })
  }

  // Recalculate height if text properties change
  useEffect(() => {
    if (textRef.current) {
      const calculatedHeight = textRef.current.height()
      if (Math.abs(calculatedHeight - element.height) > 1) {
        onChange({ height: calculatedHeight })
      }
    }
  }, [
    element.text,
    element.fontSize,
    element.width,
    element.lineHeight,
    element.padding,
    element.fontFamily,
    element.fontWeight,
    onChange,
    element.height,
  ])

  return (
    <Label
      ref={labelRef}
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
      <Tag fill={element.backgroundColor || 'transparent'} cornerRadius={element.cornerRadius} />
      <Text
        ref={textRef}
        text={element.text}
        fontFamily={element.fontFamily}
        fontSize={element.fontSize}
        fontStyle={element.fontWeight === 700 ? 'bold' : 'normal'}
        fill={element.textColor}
        align={element.align}
        lineHeight={element.lineHeight}
        padding={element.padding}
        width={element.width}
      />
    </Label>
  )
}

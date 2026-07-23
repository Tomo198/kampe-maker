import React, { useEffect, useRef } from 'react'
import { Transformer } from 'react-konva'
import type Konva from 'konva'
import type { CanvasElement } from '../../models/element'

type Props = {
  selectedNodes: Konva.Node[]
  onTransformEnd: (updates: { id: string; updates: Partial<CanvasElement> }[]) => void
}

export const TransformerUI: React.FC<Props> = ({ selectedNodes, onTransformEnd }) => {
  const trRef = useRef<Konva.Transformer>(null)

  useEffect(() => {
    if (selectedNodes.length > 0 && trRef.current) {
      const layer = trRef.current.getLayer()
      trRef.current.nodes(selectedNodes)
      layer?.batchDraw()
    } else if (trRef.current) {
      trRef.current.nodes([])
    }
  }, [selectedNodes])

  if (selectedNodes.length === 0) {
    return null
  }

  return (
    <Transformer
      ref={trRef}
      boundBoxFunc={(oldBox, newBox) => {
        if (newBox.width < 20 || newBox.height < 20) {
          return oldBox
        }
        return newBox
      }}
      flipEnabled={false}
      onTransformEnd={() => {
        const nodes = trRef.current?.nodes() || []
        const updates: { id: string; updates: Partial<CanvasElement> }[] = []

        for (const node of nodes) {
          const scaleX = node.scaleX()
          const scaleY = node.scaleY()

          node.scaleX(1)
          node.scaleY(1)

          updates.push({
            id: node.id(),
            updates: {
              x: node.x(),
              y: node.y(),
              width: Math.max(20, node.width() * scaleX),
              height: Math.max(20, node.height() * scaleY),
              rotation: node.rotation(),
            },
          })
        }

        if (updates.length > 0) {
          onTransformEnd(updates)
        }
      }}
    />
  )
}

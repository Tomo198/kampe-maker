import React, { useEffect, useRef, useState } from 'react'
import { Stage, Layer, Rect, Group } from 'react-konva'
import type Konva from 'konva'
import { useProjectStore } from '../../store/projectStore'
import { useEditorStore } from '../../store/editorStore'
import { ImageNode } from './ImageNode'
import { ShapeNode } from './ShapeNode'
import { TextNode } from './TextNode'
import { StampNode } from './StampNode'
import { TransformerUI } from './TransformerUI'
import { CropUI } from './CropUI'
import type { CanvasElement, ImageElement } from '../../models/element'
import { calculateSnap } from '../../utils/snapping'
import { handleNodeSelect } from '../../features/projects/selectionHandler'

export const CanvasArea: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<Konva.Stage>(null)
  const layerRef = useRef<Konva.Layer>(null)
  const dragStartOffset = useRef<{ [id: string]: { x: number; y: number } }>({})
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [selectedNodes, setSelectedNodes] = useState<Konva.Node[]>([])
  const [isSpacePressed, setIsSpacePressed] = useState(false)
  const [isAltPressed, setIsAltPressed] = useState(false)
  const [isShiftPressed, setIsShiftPressed] = useState(false)

  // Rubberband selection
  const [selectionRect, setSelectionRect] = useState<{
    x: number
    y: number
    width: number
    height: number
  } | null>(null)
  const selectionStartPos = useRef<{ x: number; y: number } | null>(null)

  // Snapping guides
  const [guides, setGuides] = useState<
    { axis: 'x' | 'y'; position: number; start: number; end: number }[]
  >([])

  const project = useProjectStore((state) => state.project)
  const updateElements = useProjectStore((state) => state.updateElements)
  const removeElement = useProjectStore((state) => state.removeElement)

  const {
    zoom,
    setZoom,
    pan,
    setPan,
    selectedElements: selectedRefs,
    setSelectedElements,
    editingGroupId,
    cropMode,
  } = useEditorStore()

  // Auto-resize
  useEffect(() => {
    const checkSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        })
      }
    }
    checkSize()
    window.addEventListener('resize', checkSize)
    return () => window.removeEventListener('resize', checkSize)
  }, [])

  // Sync selected nodes
  useEffect(() => {
    if (!stageRef.current) return
    const stage = stageRef.current
    const nodes: Konva.Node[] = []

    // We only select the actual nodes, not group pseudo-nodes.
    // If a group is selected, we select all its children visually?
    // Actually, Transformer on multiple nodes requires the individual nodes.
    const elementIds = new Set<string>()
    if (project) {
      for (const ref of selectedRefs) {
        if (ref.type === 'group') {
          project.elements
            .filter((el) => el.groupId === ref.id)
            .forEach((el) => elementIds.add(el.id))
        } else {
          elementIds.add(ref.id)
        }
      }
    }

    elementIds.forEach((id) => {
      const node = stage.findOne(`#${id}`)
      if (node) nodes.push(node)
    })

    setSelectedNodes(nodes)
  }, [selectedRefs, project])

  // Keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const active = document.activeElement
        if (active) {
          const tag = active.tagName.toLowerCase()
          if (
            tag === 'input' ||
            tag === 'textarea' ||
            active.getAttribute('contenteditable') === 'true'
          )
            return
        }
        if (selectedRefs.length > 0 && !cropMode) {
          // Remove selected elements
          const toRemove = new Set<string>()
          for (const ref of selectedRefs) {
            if (ref.type === 'group') {
              project?.elements
                .filter((el) => el.groupId === ref.id)
                .forEach((el) => toRemove.add(el.id))
            } else {
              toRemove.add(ref.id)
            }
          }
          toRemove.forEach((id) => removeElement(id))
          setSelectedElements([])
        }
      }
      if (e.code === 'Space') setIsSpacePressed(true)
      if (e.key === 'Alt') setIsAltPressed(true)
      if (e.key === 'Shift') setIsShiftPressed(true)
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') setIsSpacePressed(false)
      if (e.key === 'Alt') setIsAltPressed(false)
      if (e.key === 'Shift') setIsShiftPressed(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [selectedRefs, cropMode, removeElement, setSelectedElements, project])

  if (!project)
    return (
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%', backgroundColor: 'var(--color-bg-canvas-outer)' }}
      />
    )

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()
    if (e.evt.ctrlKey) {
      const stage = e.target.getStage()
      if (!stage) return
      const oldScale = zoom
      const pointer = stage.getPointerPosition()
      if (!pointer) return
      const mousePointTo = { x: (pointer.x - pan.x) / oldScale, y: (pointer.y - pan.y) / oldScale }
      const newScale = e.evt.deltaY > 0 ? oldScale * 0.9 : oldScale * 1.1
      setZoom(newScale)
      setPan({ x: pointer.x - mousePointTo.x * newScale, y: pointer.y - mousePointTo.y * newScale })
    } else {
      setPan({ x: pan.x - e.evt.deltaX, y: pan.y - e.evt.deltaY })
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleStageMouseDown = (e: any) => {
    if (cropMode || isSpacePressed) return
    const clickedOnEmpty = e.target === e.target.getStage() || e.target.name() === 'background'
    if (clickedOnEmpty) {
      const pos = e.target.getStage()?.getRelativePointerPosition()
      if (pos) {
        selectionStartPos.current = pos
        setSelectionRect({ x: pos.x, y: pos.y, width: 0, height: 0 })
      }
      if (!e.evt.shiftKey) {
        setSelectedElements([])
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleNodeClick = (e: any, elementId: string) => {
    if (cropMode) return
    e.cancelBubble = true // Prevent stage click
    handleNodeSelect(
      elementId,
      e.evt.shiftKey,
      project.elements,
      selectedRefs,
      editingGroupId,
      setSelectedElements,
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleStageMouseMove = (e: any) => {
    if (selectionStartPos.current && selectionRect) {
      const pos = e.target.getStage()?.getRelativePointerPosition()
      if (pos) {
        setSelectionRect({
          x: Math.min(selectionStartPos.current.x, pos.x),
          y: Math.min(selectionStartPos.current.y, pos.y),
          width: Math.abs(pos.x - selectionStartPos.current.x),
          height: Math.abs(pos.y - selectionStartPos.current.y),
        })
      }
    }
  }

  const handleStageMouseUp = () => {
    if (selectionStartPos.current && selectionRect) {
      // Find intersecting elements
      const newSelection: { id: string; type: 'element' | 'group' }[] = isShiftPressed
        ? [...selectedRefs]
        : []

      const rectX = selectionRect.x
      const rectY = selectionRect.y
      const rectW = selectionRect.width
      const rectH = selectionRect.height

      // Small optimization: only intersect if rect is visible
      if (rectW > 5 && rectH > 5) {
        const addedGroups = new Set<string>()
        project.elements.forEach((el) => {
          if (el.locked || !el.visible) return
          const elW =
            el.type === 'shape' && (el.shapeType === 'line' || el.shapeType === 'arrow')
              ? Math.abs(el.points[2] - el.points[0])
              : 'width' in el
                ? (el as { width: number }).width
                : 0
          const elH =
            el.type === 'shape' && (el.shapeType === 'line' || el.shapeType === 'arrow')
              ? Math.abs(el.points[3] - el.points[1])
              : 'height' in el
                ? (el as { height: number }).height
                : 0

          const intersectX = Math.max(rectX, el.x) < Math.min(rectX + rectW, el.x + elW)
          const intersectY = Math.max(rectY, el.y) < Math.min(rectY + rectH, el.y + elH)

          if (intersectX && intersectY) {
            if (el.groupId) {
              if (!addedGroups.has(el.groupId)) {
                addedGroups.add(el.groupId)
                if (!newSelection.some((r) => r.id === el.groupId && r.type === 'group')) {
                  newSelection.push({ id: el.groupId, type: 'group' })
                }
              }
            } else {
              if (!newSelection.some((r) => r.id === el.id && r.type === 'element')) {
                newSelection.push({ id: el.id, type: 'element' })
              }
            }
          }
        })
        setSelectedElements(newSelection)
      }

      selectionStartPos.current = null
      setSelectionRect(null)
    }
  }

  // Dragging logic variables
  const handleDragStart = (e: Konva.KonvaEventObject<DragEvent>) => {
    if (cropMode) return
    const id = e.target.id()
    const node = stageRef.current?.findOne(`#${id}`)
    if (!node) return

    // If the node is not selected, select it
    let currentRefs = selectedRefs
    const isSelected = selectedRefs.some(
      (r) =>
        r.id === id ||
        (r.type === 'group' && project.elements.find((el) => el.id === id)?.groupId === r.id),
    )

    if (!isSelected) {
      const el = project.elements.find((el) => el.id === id)
      if (el) {
        if (el.groupId) {
          currentRefs = [{ id: el.groupId, type: 'group' }]
        } else {
          currentRefs = [{ id, type: 'element' }]
        }
        setSelectedElements(currentRefs)
      }
    }

    // Record start positions for all nodes that should move
    dragStartOffset.current = {}
    const elementsToMove = new Set<string>()
    for (const ref of currentRefs) {
      if (ref.type === 'group') {
        project.elements
          .filter((el) => el.groupId === ref.id)
          .forEach((el) => elementsToMove.add(el.id))
      } else {
        elementsToMove.add(ref.id)
      }
    }

    elementsToMove.forEach((elId) => {
      const el = project.elements.find((e) => e.id === elId)
      if (el) dragStartOffset.current[elId] = { x: el.x, y: el.y }
    })
  }

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    if (cropMode) return
    const id = e.target.id()
    if (!dragStartOffset.current[id]) return

    const elStart = dragStartOffset.current[id]
    const dx = e.target.x() - elStart.x
    const dy = e.target.y() - elStart.y

    // Calculate bbox of all moving elements
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity
    const movingIds = Object.keys(dragStartOffset.current)

    movingIds.forEach((mId) => {
      const el = project.elements.find((e) => e.id === mId)
      if (!el) return
      const w =
        el.type === 'shape' && (el.shapeType === 'line' || el.shapeType === 'arrow')
          ? Math.abs(el.points[2] - el.points[0])
          : 'width' in el
            ? (el as { width: number }).width
            : 0
      const h =
        el.type === 'shape' && (el.shapeType === 'line' || el.shapeType === 'arrow')
          ? Math.abs(el.points[3] - el.points[1])
          : 'height' in el
            ? (el as { height: number }).height
            : 0
      const startPos = dragStartOffset.current[mId]
      const nx = startPos.x + dx
      const ny = startPos.y + dy
      if (nx < minX) minX = nx
      if (ny < minY) minY = ny
      if (nx + w > maxX) maxX = nx + w
      if (ny + h > maxY) maxY = ny + h
    })

    // Perform snapping
    const snapResult = calculateSnap(
      { x: minX, y: minY, width: maxX - minX, height: maxY - minY },
      project.elements,
      movingIds,
      project.canvas.width,
      project.canvas.height,
      project.canvas.snapEnabled,
      isAltPressed,
    )

    setGuides(snapResult.guides)

    const finalDx = dx + (snapResult.snappedX - minX)
    const finalDy = dy + (snapResult.snappedY - minY)

    // Apply imperative update to all moving nodes
    movingIds.forEach((mId) => {
      const node = stageRef.current?.findOne(`#${mId}`)
      if (node) {
        node.x(dragStartOffset.current[mId].x + finalDx)
        node.y(dragStartOffset.current[mId].y + finalDy)
      }
    })
  }

  const handleDragEnd = () => {
    if (cropMode) return
    setGuides([])

    // Commit all updates
    const updates: { id: string; updates: Partial<CanvasElement> }[] = []
    const movingIds = Object.keys(dragStartOffset.current)

    movingIds.forEach((mId) => {
      const node = stageRef.current?.findOne(`#${mId}`)
      if (node) {
        updates.push({ id: mId, updates: { x: node.x(), y: node.y() } })
      }
    })

    if (updates.length > 0) {
      updateElements(updates)
    }
    dragStartOffset.current = {}
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: 'var(--color-bg-canvas-outer)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        onWheel={handleWheel}
        draggable={isSpacePressed}
        style={{ cursor: isSpacePressed ? 'grab' : 'default' }}
        onDragMove={(e) => {
          if (e.target === stageRef.current) {
            setPan({ x: e.target.x(), y: e.target.y() })
          }
        }}
        onDragEnd={(_e) => {
          if (_e.target === stageRef.current) {
            setPan({ x: _e.target.x(), y: _e.target.y() })
            _e.target.position({ x: 0, y: 0 })
          }
        }}
        onMouseDown={handleStageMouseDown}
        onTouchStart={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onTouchMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
        onTouchEnd={handleStageMouseUp}
      >
        <Layer ref={layerRef}>
          <Group x={pan.x} y={pan.y} scaleX={zoom} scaleY={zoom}>
            {/* Outline for the Canvas bounds */}
            <Rect
              x={0}
              y={0}
              width={project.canvas.width}
              height={project.canvas.height}
              fill={project.canvas.transparent ? 'transparent' : project.canvas.backgroundColor}
              shadowColor="black"
              shadowBlur={20}
              shadowOpacity={0.2}
              shadowOffsetX={0}
              shadowOffsetY={8}
              stroke="rgba(0,0,0,0.1)"
              strokeWidth={1 / zoom}
              listening={!project.canvas.transparent}
              name="background"
            />

            {project.elements.map((el) => {
              if (!el.visible) return null
              if (el.type === 'image') {
                if (cropMode?.elementId === el.id)
                  return <CropUI key={el.id} element={el as ImageElement} />
                return (
                  <ImageNode
                    key={el.id}
                    element={el as ImageElement}
                    onSelect={(e) => handleNodeClick(e, el.id)}
                    onChange={() => {}}
                    isCropModeActive={!!cropMode}
                    onDragStart={handleDragStart}
                    onDragMove={handleDragMove}
                    onDragEnd={handleDragEnd}
                  />
                )
              } else if (el.type === 'shape') {
                return (
                  <ShapeNode
                    key={el.id}
                    element={el as import('../../models/element').ShapeElement}
                    onSelect={(e) => handleNodeClick(e, el.id)}
                    onChange={() => {}}
                    onDragStart={handleDragStart}
                    onDragMove={handleDragMove}
                    onDragEnd={handleDragEnd}
                  />
                )
              } else if (el.type === 'text') {
                return (
                  <TextNode
                    key={el.id}
                    element={el as import('../../models/element').TextElement}
                    onSelect={(e) => handleNodeClick(e, el.id)}
                    onChange={() => {}}
                    onDragStart={handleDragStart}
                    onDragMove={handleDragMove}
                    onDragEnd={handleDragEnd}
                  />
                )
              } else if (el.type === 'stamp') {
                return (
                  <StampNode
                    key={el.id}
                    element={el as import('../../models/element').StampElement}
                    onSelect={(e) => handleNodeClick(e, el.id)}
                    onChange={() => {}}
                    onDragStart={handleDragStart}
                    onDragMove={handleDragMove}
                    onDragEnd={handleDragEnd}
                  />
                )
              }
              return null
            })}

            {/* Rubberband Selection Rect */}
            {selectionRect && (
              <Rect
                x={selectionRect.x}
                y={selectionRect.y}
                width={selectionRect.width}
                height={selectionRect.height}
                fill="rgba(0, 161, 255, 0.3)"
                stroke="rgba(0, 161, 255, 0.8)"
                strokeWidth={1 / zoom}
                listening={false}
              />
            )}

            {/* Snapping Guides */}
            {guides.map((g, i) => (
              <Rect
                key={i}
                x={g.axis === 'x' ? g.position : g.start}
                y={g.axis === 'y' ? g.position : g.start}
                width={g.axis === 'x' ? 1 / zoom : g.end - g.start}
                height={g.axis === 'y' ? 1 / zoom : g.end - g.start}
                fill="red"
                listening={false}
              />
            ))}
          </Group>
        </Layer>

        <Layer>
          <Group x={pan.x} y={pan.y} scaleX={zoom} scaleY={zoom}>
            {!cropMode && (
              <TransformerUI
                selectedNodes={selectedNodes}
                onTransformEnd={(updates) => updateElements(updates)}
              />
            )}
          </Group>
        </Layer>
      </Stage>

      {/* DOM Overlay Root for Crop UI */}
      <div
        id="crop-overlay-root"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      />
    </div>
  )
}

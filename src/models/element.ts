import type { NormalizedCrop } from './crop'

export type BaseElement = {
  id: string
  type: 'image' | 'text' | 'stamp' | 'shape'
  name: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
  visible: boolean
  locked: boolean
  groupId?: string
}

export type ImageElement = BaseElement & {
  type: 'image'
  assetId: string
  crop: NormalizedCrop
  border?: {
    color: string
    width: number
  }
  cornerRadius: number
}

export type TextElement = BaseElement & {
  type: 'text'
  text: string
  fontFamily: 'Noto Sans JP'
  fontSize: number
  fontWeight: 400 | 700
  textColor: string
  backgroundColor?: string
  align: 'left' | 'center' | 'right'
  lineHeight: number
  padding: number
  cornerRadius: number
}

export type StampElement = BaseElement & {
  type: 'stamp'
  stampId: string
  text?: string
  textColor: string
  backgroundColor: string
  borderColor?: string
  cornerRadius: number
}

export type ShapeElement = BaseElement & {
  type: 'shape'
  shapeType: 'rectangle' | 'ellipse' | 'line' | 'arrow'
  strokeColor: string
  strokeWidth: number
  fillColor?: string
}

export type CanvasElement = ImageElement | TextElement | StampElement | ShapeElement

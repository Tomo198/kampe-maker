// Canvas presets and limits (§7)

export type CanvasPreset = {
  label: string
  width: number
  height: number
}

export const CANVAS_PRESETS: CanvasPreset[] = [
  { label: 'PC横長', width: 1920, height: 1080 },
  { label: 'PC高解像度', width: 2560, height: 1440 },
  { label: 'タブレット横長', width: 1920, height: 1200 },
  { label: 'スマートフォン縦長', width: 1080, height: 1920 },
  { label: '正方形', width: 1200, height: 1200 },
  { label: 'A4縦', width: 2480, height: 3508 },
  { label: 'A4横', width: 3508, height: 2480 },
]

export const DEFAULT_CANVAS_PRESET = CANVAS_PRESETS[0]

// Canvas size limits (§7.2)
export const CANVAS_MIN_SIZE = 320
export const CANVAS_MAX_SIZE = 4096

// Export limits (§22.5)
export const EXPORT_MAX_EDGE = 8192
export const EXPORT_MAX_PIXELS = 40_000_000

// Image limits (§8.4)
export const IMAGE_WARN_SIZE_BYTES = 10 * 1024 * 1024 // 10MB
export const IMAGE_MAX_SIZE_BYTES = 25 * 1024 * 1024 // 25MB
export const ASSET_WARN_COUNT = 30

// Project limits (§21.5)
export const PROJECT_WARN_SIZE_BYTES = 100 * 1024 * 1024 // 100MB
export const PROJECT_MAX_SIZE_BYTES = 250 * 1024 * 1024 // 250MB
export const ZIP_MAX_FILE_COUNT = 200
export const ZIP_MAX_EXTRACTED_SIZE = 500 * 1024 * 1024 // 500MB

// Performance limits (§9.4)
export const ELEMENT_WARN_COUNT = 100

// Preview generation (§9.2)
export const PREVIEW_MAX_EDGE = 2000
export const THUMBNAIL_MAX_EDGE = 320
export const PREVIEW_THRESHOLD_EDGE = 3000

// Grid defaults (§17.3)
export const DEFAULT_GRID_SIZE = 20

// Movement (§10.2)
export const MOVE_STEP = 1
export const MOVE_STEP_SHIFT = 10

// Minimum element display size (§10.3)
export const MIN_ELEMENT_DISPLAY_SIZE = 20

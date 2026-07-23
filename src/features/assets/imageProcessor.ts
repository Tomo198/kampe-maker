import {
  PREVIEW_MAX_EDGE,
  THUMBNAIL_MAX_EDGE,
  PREVIEW_THRESHOLD_EDGE,
  IMAGE_WARN_SIZE_BYTES,
  IMAGE_MAX_SIZE_BYTES,
} from '../../constants/canvas'

export type ProcessedImage = {
  originalBlob: Blob
  previewBlob: Blob
  thumbnailBlob: Blob
  width: number
  height: number
  mimeType: string
}

export class ImageImportError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ImageImportError'
  }
}

export async function processImageFile(
  file: File,
): Promise<ProcessedImage | { warning: string; data: ProcessedImage }> {
  // 1. Format Check
  const validTypes = ['image/png', 'image/jpeg', 'image/webp']
  if (!validTypes.includes(file.type)) {
    throw new ImageImportError('未対応の画像形式です。PNG、JPEG、WebPのみ対応しています。')
  }

  // 2. Size Check
  if (file.size > IMAGE_MAX_SIZE_BYTES) {
    throw new ImageImportError('ファイルサイズが25MBを超えています。')
  }

  // 3. Decode & EXIF correction
  // Drawing to an offscreen canvas automatically bakes EXIF orientation in modern browsers.
  const img = new Image()
  const imgLoadPromise = new Promise((resolve, reject) => {
    img.onload = resolve
    img.onerror = () =>
      reject(
        new ImageImportError(
          '画像の読み込みに失敗しました。ファイルが破損している可能性があります。',
        ),
      )
  })

  const objectUrl = URL.createObjectURL(file)
  img.src = objectUrl

  try {
    await imgLoadPromise
  } finally {
    URL.revokeObjectURL(objectUrl)
  }

  const { width, height } = img

  // Create Original Blob (baked)
  const originalBlob = await createBlobFromImage(img, width, height, file.type)

  // 4. Generate Scaled Blobs
  const maxEdge = Math.max(width, height)
  let previewBlob = originalBlob

  if (maxEdge > PREVIEW_THRESHOLD_EDGE) {
    const scale = PREVIEW_MAX_EDGE / maxEdge
    previewBlob = await createBlobFromImage(img, width * scale, height * scale, file.type)
  }

  const thumbScale = Math.min(1, THUMBNAIL_MAX_EDGE / maxEdge)
  const thumbnailBlob = await createBlobFromImage(
    img,
    width * thumbScale,
    height * thumbScale,
    file.type,
  )

  const result: ProcessedImage = {
    originalBlob,
    previewBlob,
    thumbnailBlob,
    width,
    height,
    mimeType: file.type,
  }

  if (file.size > IMAGE_WARN_SIZE_BYTES) {
    return {
      warning: 'ファイルサイズが大きいため、動作が重くなる可能性があります。',
      data: result,
    }
  }

  return result
}

async function createBlobFromImage(
  img: HTMLImageElement,
  w: number,
  h: number,
  type: string,
): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas context not available')

  ctx.drawImage(img, 0, 0, w, h)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Blob generation failed'))
      },
      type,
      type === 'image/jpeg' ? 0.9 : undefined,
    )
  })
}

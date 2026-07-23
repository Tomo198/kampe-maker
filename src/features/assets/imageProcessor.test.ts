import { describe, it, expect, vi, beforeEach } from 'vitest'
import { processImageFile, ImageImportError } from './imageProcessor'
import { cleanupOrphanedBlobs } from './garbageCollection'
import { db } from '../../db/database'

// Mock DOM/Browser APIs
globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
globalThis.URL.revokeObjectURL = vi.fn()
;(globalThis as unknown as { Image: unknown }).Image = class {
  onload!: () => void
  onerror!: () => void
  src!: string
  width: number = 800
  height: number = 600

  constructor() {
    setTimeout(() => {
      this.onload()
    }, 10)
  }
} as unknown

globalThis.document.createElement = vi.fn((tag) => {
  if (tag === 'canvas') {
    return {
      getContext: () => ({
        drawImage: vi.fn(),
      }),
      toBlob: (cb: (blob: Blob) => void) => cb(new Blob(['mock'], { type: 'image/png' })),
    } as unknown as HTMLCanvasElement
  }
  return {} as unknown as HTMLElement
})

describe('imageProcessor', () => {
  it('throws ImageImportError for invalid formats', async () => {
    const file = new File([''], 'test.txt', { type: 'text/plain' })
    await expect(processImageFile(file)).rejects.toThrow(ImageImportError)
  })

  it('throws ImageImportError for oversized files', async () => {
    const file = new File([''], 'huge.png', { type: 'image/png' })
    Object.defineProperty(file, 'size', { value: 30 * 1024 * 1024 }) // 30MB
    await expect(processImageFile(file)).rejects.toThrow(ImageImportError)
  })

  it('processes valid image correctly', async () => {
    const file = new File([''], 'test.png', { type: 'image/png' })
    const result = await processImageFile(file)

    // no warning
    expect('warning' in result).toBe(false)
    const data = result as {
      width: number
      height: number
      mimeType: string
      originalBlob: Blob
      previewBlob: Blob
      thumbnailBlob: Blob
    }
    expect(data.width).toBe(800)
    expect(data.height).toBe(600)
    expect(data.mimeType).toBe('image/png')
    expect(data.originalBlob).toBeDefined()
    expect(data.previewBlob).toBeDefined()
    expect(data.thumbnailBlob).toBeDefined()
  })

  it('returns warning for large but acceptable files', async () => {
    const file = new File([''], 'large.png', { type: 'image/png' })
    Object.defineProperty(file, 'size', { value: 15 * 1024 * 1024 }) // 15MB
    const result = await processImageFile(file)

    expect('warning' in result).toBe(true)
    expect((result as { data: { width: number } }).data.width).toBe(800)
  })
})

describe('garbageCollection', () => {
  beforeEach(async () => {
    await db.blobs.clear()
    await db.projects.clear()
  })

  it('deletes orphaned blobs', async () => {
    await db.blobs.bulkPut([
      {
        key: 'used-blob',
        projectId: 'p1',
        assetId: 'a1',
        kind: 'original',
        blob: new Blob(),
        createdAt: '',
      },
      {
        key: 'orphaned-blob',
        projectId: 'p2',
        assetId: 'a2',
        kind: 'original',
        blob: new Blob(),
        createdAt: '',
      },
    ])

    await db.projects.put({
      id: 'p1',
      name: 'Project 1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      formatVersion: 1,
      canvas: { width: 100, height: 100, backgroundColor: '#fff', transparent: false, gridEnabled: false, gridSize: 20, snapEnabled: true },
      assets: [{
        id: 'a1',
        originalBlobKey: 'used-blob',
        name: 'test',
        mimeType: 'image/png',
        width: 100,
        height: 100,
        sizeBytes: 1000,
        previewBlobKey: 'prev',
        thumbnailBlobKey: 'thumb',
        createdAt: new Date().toISOString()
      }],
      elements: [],
      groups: [],
    })

    await cleanupOrphanedBlobs()

    const remainingBlobs = await db.blobs.toArray()
    expect(remainingBlobs.length).toBe(1)
    expect(remainingBlobs[0].key).toBe('used-blob')
  })
})

export type Asset = {
  id: string
  name: string
  mimeType: string
  width: number
  height: number
  sizeBytes: number
  originalBlobKey: string
  previewBlobKey: string
  thumbnailBlobKey: string
  createdAt: string
  deletedAt?: string
}

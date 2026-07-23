import { useState, useEffect } from 'react'
import { db } from '../../db/database'

export function useObjectURL(blobKey: string | null | undefined): string | null {
  const [objectUrl, setObjectUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!blobKey) {
      return
    }

    let url: string | null = null
    let isMounted = true

    const loadBlob = async () => {
      try {
        const record = await db.blobs.get(blobKey)
        if (record && isMounted) {
          url = URL.createObjectURL(record.blob)
          setObjectUrl(url)
        }
      } catch (err) {
        console.error('Failed to load blob:', err)
      }
    }

    loadBlob()

    return () => {
      isMounted = false
      if (url) {
        URL.revokeObjectURL(url)
      }
    }
  }, [blobKey])

  return objectUrl
}

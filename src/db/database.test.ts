import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Dexie from 'dexie'
import { KampeDB } from './database'
import type { ProjectRecord, BlobRecord } from './types'

describe('KampeDB', () => {
  let testDb: KampeDB

  beforeEach(async () => {
    // Create a fresh database for each test
    testDb = new KampeDB()
    await testDb.open()
  })

  afterEach(async () => {
    testDb.close()
    await Dexie.delete('KampeDB')
  })

  describe('projects table', () => {
    it('saves and retrieves a project record', async () => {
      const project: ProjectRecord = {
        id: 'test-project-1',
        name: 'テストプロジェクト',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        formatVersion: 1,
        canvas: { width: 100, height: 100, backgroundColor: '#fff', transparent: false, gridEnabled: false, gridSize: 20, snapEnabled: true },
        assets: [],
        elements: [],
        groups: [],
      }

      await testDb.projects.put(project)
      const retrieved = await testDb.projects.get('test-project-1')

      expect(retrieved).toBeDefined()
      expect(retrieved!.name).toBe('テストプロジェクト')
      expect(retrieved!.id).toBe('test-project-1')
    })

    it('updates an existing project record', async () => {
      const project: ProjectRecord = {
        id: 'test-project-2',
        name: '初期名',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
        formatVersion: 1,
        canvas: { width: 100, height: 100, backgroundColor: '#fff', transparent: false, gridEnabled: false, gridSize: 20, snapEnabled: true },
        assets: [],
        elements: [],
        groups: [],
      }

      await testDb.projects.put(project)
      await testDb.projects.put({
        ...project,
        name: '更新後',
        updatedAt: '2025-01-02T00:00:00.000Z',
      })

      const retrieved = await testDb.projects.get('test-project-2')
      expect(retrieved!.name).toBe('更新後')
    })

    it('deletes a project record', async () => {
      const project: ProjectRecord = {
        id: 'test-project-3',
        name: '削除テスト',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
        formatVersion: 1,
        canvas: { width: 100, height: 100, backgroundColor: '#fff', transparent: false, gridEnabled: false, gridSize: 20, snapEnabled: true },
        assets: [],
        elements: [],
        groups: [],
      }

      await testDb.projects.put(project)
      await testDb.projects.delete('test-project-3')

      const retrieved = await testDb.projects.get('test-project-3')
      expect(retrieved).toBeUndefined()
    })

    it('lists all projects', async () => {
      await testDb.projects.bulkPut([
        {
          id: 'p1',
          name: 'P1',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
          formatVersion: 1,
          canvas: { width: 100, height: 100, backgroundColor: '#fff', transparent: false, gridEnabled: false, gridSize: 20, snapEnabled: true },
          assets: [],
          elements: [],
          groups: [],
        },
        {
          id: 'p2',
          name: 'P2',
          createdAt: '2025-01-02T00:00:00.000Z',
          updatedAt: '2025-01-02T00:00:00.000Z',
          formatVersion: 1,
          canvas: { width: 100, height: 100, backgroundColor: '#fff', transparent: false, gridEnabled: false, gridSize: 20, snapEnabled: true },
          assets: [],
          elements: [],
          groups: [],
        },
      ])

      const all = await testDb.projects.toArray()
      expect(all).toHaveLength(2)
    })
  })

  describe('blobs table', () => {
    it('saves and retrieves a blob record', async () => {
      const blob = new Blob(['test image data'], { type: 'image/png' })
      const record: BlobRecord = {
        key: 'blob-1',
        projectId: 'project-1',
        assetId: 'asset-1',
        kind: 'original',
        blob,
        createdAt: '2025-01-01T00:00:00.000Z',
      }

      await testDb.blobs.put(record)
      const retrieved = await testDb.blobs.get('blob-1')

      expect(retrieved).toBeDefined()
      expect(retrieved!.kind).toBe('original')
      expect(retrieved!.blob).toBeTruthy()
    })

    it('queries blobs by compound index [projectId+assetId]', async () => {
      const blob = new Blob(['data'], { type: 'image/png' })

      await testDb.blobs.bulkPut([
        {
          key: 'b1',
          projectId: 'p1',
          assetId: 'a1',
          kind: 'original' as const,
          blob,
          createdAt: '2025-01-01T00:00:00.000Z',
        },
        {
          key: 'b2',
          projectId: 'p1',
          assetId: 'a1',
          kind: 'preview' as const,
          blob,
          createdAt: '2025-01-01T00:00:00.000Z',
        },
        {
          key: 'b3',
          projectId: 'p1',
          assetId: 'a2',
          kind: 'original' as const,
          blob,
          createdAt: '2025-01-01T00:00:00.000Z',
        },
        {
          key: 'b4',
          projectId: 'p2',
          assetId: 'a1',
          kind: 'original' as const,
          blob,
          createdAt: '2025-01-01T00:00:00.000Z',
        },
      ])

      const results = await testDb.blobs.where('[projectId+assetId]').equals(['p1', 'a1']).toArray()

      expect(results).toHaveLength(2)
      expect(results.every((r) => r.projectId === 'p1' && r.assetId === 'a1')).toBe(true)
    })

    it('supports deletedAt for logical deletion', async () => {
      const blob = new Blob(['data'], { type: 'image/png' })
      const record: BlobRecord = {
        key: 'blob-delete',
        projectId: 'p1',
        assetId: 'a1',
        kind: 'original',
        blob,
        createdAt: '2025-01-01T00:00:00.000Z',
        deletedAt: '2025-01-02T00:00:00.000Z',
      }

      await testDb.blobs.put(record)
      const retrieved = await testDb.blobs.get('blob-delete')

      expect(retrieved!.deletedAt).toBe('2025-01-02T00:00:00.000Z')
    })
  })
})

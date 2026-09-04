import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import type { SlicePanel } from '../types'

const slicer = {
  slices: [] as SlicePanel[],
  selections: { hierarchy: { folder1: true } } as Record<string, any>,
  pinnedSlice: null as { rowSelection: Record<string, boolean> } | null,
}
const powerpack = { powerLicense: true }

vi.mock('../context/SlicerContext', () => ({
  useOptionalSlicerContext: () => ({
    slices: slicer.slices,
    pinnedSlice: slicer.pinnedSlice,
    getPanelSelection: (type: string) => slicer.selections[type] ?? {},
  }),
}))
vi.mock('@shared/context/PowerpackContext', () => ({ usePowerpack: () => powerpack }))

const { useHierarchySelection } = await import('./useHierarchySelection')

beforeEach(() => {
  slicer.slices = [
    { id: 'status', sliceType: 'status' },
    { id: 'hierarchy', sliceType: 'hierarchy' },
  ]
  slicer.pinnedSlice = null
  powerpack.powerLicense = true
})

const render = () => renderHook(() => useHierarchySelection()).result.current

describe('useHierarchySelection', () => {
  test('a hierarchy panel anywhere in the stack owns the folder scope', () => {
    expect(render()).toEqual({ folder1: true })
  })

  test('a hierarchy panel hidden by the license gate does not scope anything', () => {
    powerpack.powerLicense = false
    expect(render()).toBe(null)
  })

  test('the pinned slice still holds the scope for pages without a hierarchy panel', () => {
    slicer.slices = [{ id: 'status', sliceType: 'status' }]
    slicer.pinnedSlice = { rowSelection: { folder2: true } }
    expect(render()).toEqual({ folder2: true })
  })

  test('an unlicensed hierarchy in the first panel still scopes', () => {
    powerpack.powerLicense = false
    slicer.slices = [
      { id: 'hierarchy', sliceType: 'hierarchy' },
      { id: 'status', sliceType: 'status' },
    ]
    expect(render()).toEqual({ folder1: true })
  })
})

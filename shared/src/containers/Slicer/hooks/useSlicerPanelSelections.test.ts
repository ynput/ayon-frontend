import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import type { RowSelectionState } from '@tanstack/react-table'
import type { SlicePanel } from '../types'

const slicer = {
  slices: [] as SlicePanel[],
  selections: {} as Record<string, RowSelectionState>,
}
const powerpack = { powerLicense: true, isLoading: false }

vi.mock('../context/SlicerContext', () => ({
  useSlicerContext: () => ({
    slices: slicer.slices,
    getPanelSelection: (id: string) => slicer.selections[id] ?? {},
  }),
}))
vi.mock('@shared/context/PowerpackContext', () => ({
  usePowerpack: () => powerpack,
}))

const { useSlicerPanelSelections } = await import('./useSlicerPanelSelections')

const attribFields = [] as any

beforeEach(() => {
  slicer.slices = [
    { id: 'status', sliceType: 'status' },
    { id: 'taskType', sliceType: 'taskType' },
  ]
  slicer.selections = { status: { Done: true }, taskType: { Lighting: true } }
  powerpack.powerLicense = true
  powerpack.isLoading = false
})

const render = () => renderHook(() => useSlicerPanelSelections(attribFields)).result.current

describe('useSlicerPanelSelections', () => {
  test('every panel contributes a selection and a filter', () => {
    const { sliceSelections, sliceFilters } = render()
    expect(sliceSelections.map((s) => s.sliceType)).toEqual(['status', 'taskType'])
    expect(sliceFilters.map((f) => f.id)).toEqual(['status', 'taskType'])
  })

  test('without a license only the first panel is allowed to filter', () => {
    powerpack.powerLicense = false
    const { sliceSelections, sliceFilters } = render()
    expect(sliceSelections.map((s) => s.sliceType)).toEqual(['status'])
    expect(sliceFilters.map((f) => f.id)).toEqual(['status'])
  })

  test('the first fetch waits while the license for a second panel is still resolving', () => {
    powerpack.isLoading = true
    expect(render().isLicensePending).toBe(true)
  })

  test('a single panel never waits for the license', () => {
    slicer.slices = [{ id: 'status', sliceType: 'status' }]
    powerpack.isLoading = true
    expect(render().isLicensePending).toBe(false)
  })

  test('a panel with nothing selected contributes no values, so it restricts nothing', () => {
    slicer.selections = { status: {}, taskType: { Lighting: true } }
    expect(render().sliceFilters.map((f) => f.values.length)).toEqual([0, 1])
  })
})

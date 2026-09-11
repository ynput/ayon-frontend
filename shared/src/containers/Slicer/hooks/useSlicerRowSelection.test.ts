import { act, renderHook } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { writeSessionStorage } from '@shared/hooks/useSessionStorage'
import { useSlicerRowSelection } from './useSlicerRowSelection'

const renderSelection = () => {
  let renders = 0
  const hook = renderHook(() => {
    renders += 1
    return useSlicerRowSelection({
      sliceTypes: ['status', 'hierarchy'],
      page: 'overview',
      projectName: 'demo',
    })
  })
  return { ...hook, renderCount: () => renders }
}

describe('useSlicerRowSelection', () => {
  test('a selection written by another panel is picked up', () => {
    const { result } = renderSelection()
    act(() => writeSessionStorage('slicer-selection-hierarchy-demo', { folder1: true }))
    expect(result.current.getPanelSelection('hierarchy')).toEqual({ folder1: true })
  })

  test('an expansion written elsewhere is picked up', () => {
    const { result } = renderSelection()
    act(() => writeSessionStorage('slicer-expanded-hierarchy-demo', { folder1: true }))
    expect(result.current.getPanelExpanded('hierarchy')).toEqual({ folder1: true })
  })

  test('panel heights do not rerender the slicer, they change nothing here', () => {
    const { renderCount } = renderSelection()
    const before = renderCount()
    act(() => writeSessionStorage('slicer-panel-heights-overview', { status: 400 }))
    expect(renderCount()).toBe(before)
  })

  test('unrelated storage keys are ignored', () => {
    const { renderCount } = renderSelection()
    const before = renderCount()
    act(() => writeSessionStorage('some-other-feature', { a: 1 }))
    expect(renderCount()).toBe(before)
  })

  test('the first panel writes to its own bucket', () => {
    const { result } = renderSelection()
    act(() => result.current.setRowSelection({ Done: true }))
    expect(result.current.rowSelection).toEqual({ Done: true })
    expect(JSON.parse(sessionStorage.getItem('slicer-selection-demo-overview-status')!)).toEqual({
      Done: true,
    })
  })

  test('hierarchy shares one bucket across pages, other types do not', () => {
    const { result } = renderSelection()
    act(() => result.current.setPanelSelection('hierarchy', { folder1: true }))
    expect(sessionStorage.getItem('slicer-selection-hierarchy-demo')).toBeTruthy()
    expect(sessionStorage.getItem('slicer-selection-demo-overview-hierarchy')).toBeNull()
  })
})

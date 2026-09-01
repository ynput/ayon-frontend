import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, test } from 'vitest'
import { SLICER_MIN_PANEL_HEIGHT as MIN, useSlicerPanelHeights } from './useSlicerSplitter'

const STORAGE_KEY = 'slicer-panel-heights-overview'

const stored = () => JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) || 'null')

const renderHeights = (panelIds: string[], collapsed: string[] = [], containerHeight = 600) =>
  renderHook(() => useSlicerPanelHeights('overview', panelIds, collapsed, containerHeight))

beforeEach(() => window.sessionStorage.clear())

describe('useSlicerPanelHeights', () => {
  test('a drag is remembered per panel id', () => {
    const { result } = renderHeights(['a', 'b'])
    act(() => result.current.handleResizeEnd({ sizes: [70, 30] }))
    expect(stored()).toEqual({ a: 420, b: MIN })
  })

  test('a collapsed panel keeps the height it had before it collapsed', () => {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ a: 400, b: 300 }))
    const { result } = renderHeights(['a', 'b'], ['a'])
    act(() => result.current.handleResizeEnd({ sizes: [10, 90] }))
    expect(stored().a).toBe(400)
  })

  test('a drag past a floor remounts the splitter so it drops its own sizes', () => {
    const { result } = renderHeights(['a', 'b'])
    const before = result.current.layoutKey
    act(() => result.current.handleResizeEnd({ sizes: [95, 5] }))
    expect(result.current.layoutKey).not.toBe(before)
  })

  test('a drag within the floors leaves the splitter mounted', () => {
    const { result } = renderHeights(['a', 'b'])
    const before = result.current.layoutKey
    act(() => result.current.handleResizeEnd({ sizes: [50, 50] }))
    expect(result.current.layoutKey).toBe(before)
  })

  test('collapsing a panel remounts the splitter', () => {
    const { result, rerender } = renderHook(
      ({ collapsed }: { collapsed: string[] }) =>
        useSlicerPanelHeights('overview', ['a', 'b'], collapsed, 600),
      { initialProps: { collapsed: [] as string[] } },
    )
    const before = result.current.layoutKey
    rerender({ collapsed: ['a'] })
    expect(result.current.layoutKey).not.toBe(before)
  })

  test('dragging the last panel never stores less than the minimum', () => {
    const { result } = renderHeights(['a', 'b'])
    act(() => result.current.setPanelHeight('b', 20))
    expect(stored().b).toBe(MIN)
  })

  test('heights left over from the old array format are ignored, not crashed on', () => {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify([12, 88]))
    const { result } = renderHeights(['a', 'b'])
    expect(result.current.panelHeights).toEqual([300, 300])
  })

  test('each page keeps its own heights', () => {
    const { result } = renderHeights(['a', 'b'])
    act(() => result.current.handleResizeEnd({ sizes: [70, 30] }))
    const other = renderHook(() => useSlicerPanelHeights('versions', ['a', 'b'], [], 600))
    expect(other.result.current.panelHeights).toEqual([300, 300])
  })
})

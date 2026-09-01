import { describe, expect, test } from 'vitest'
import {
  SLICER_COLLAPSED_PANEL_HEIGHT as COLLAPSED,
  SLICER_MIN_PANEL_HEIGHT as MIN,
  clampDraggedHeights,
  panelMinHeights,
  resolvePanelLayout,
} from './slicerPanelLayout'

describe('resolvePanelLayout', () => {
  test('an untouched panel starts at the minimum and shares the spare column', () => {
    const { heights, height } = resolvePanelLayout({}, ['a', 'b'], [], 600)
    expect(heights).toEqual([300, 300])
    expect(height).toBe(600)
  })

  test('panels that do not fit keep their height and the stack grows', () => {
    const { heights, height } = resolvePanelLayout(
      { a: 400, b: 300, c: 200 },
      ['a', 'b', 'c'],
      [],
      600,
    )
    expect(heights).toEqual([400, 300, 200])
    expect(height).toBe(900)
  })

  test('a stored height below the minimum is lifted back to it', () => {
    const { heights } = resolvePanelLayout({ a: 500, b: 20 }, ['a', 'b'], [], 400)
    expect(heights).toEqual([500, MIN])
  })

  test('adding a panel keeps the heights of the existing ones', () => {
    const { heights } = resolvePanelLayout({ a: 500, b: 300 }, ['a', 'b', 'c'], [], 400)
    expect(heights).toEqual([500, 300, MIN])
  })

  test('heights follow the panel, not its position', () => {
    const { heights } = resolvePanelLayout({ a: 500, b: 300 }, ['b', 'a'], [], 400)
    expect(heights).toEqual([300, 500])
  })

  test('a collapsed panel is just its header and gets none of the spare room', () => {
    const { heights, height } = resolvePanelLayout({ a: 300, b: 300 }, ['a', 'b'], ['a'], 600)
    expect(heights).toEqual([COLLAPSED, 600 - COLLAPSED])
    expect(height).toBe(600)
  })

  test('every panel collapsed keeps the headers stacked instead of stretched', () => {
    const { heights, sizes, height } = resolvePanelLayout(
      { a: 300, b: 300 },
      ['a', 'b'],
      ['a', 'b'],
      600,
    )
    expect(heights).toEqual([COLLAPSED, COLLAPSED])
    expect(height).toBe(COLLAPSED * 2)
    expect(sizes).toEqual([50, 50])
  })

  test('sizes add up to the whole stack', () => {
    const { sizes } = resolvePanelLayout({ a: 400, b: 200 }, ['a', 'b'], [], 0)
    expect(Math.round(sizes.reduce((a, b) => a + b, 0))).toBe(100)
    expect(sizes).toEqual([(400 / 600) * 100, (200 / 600) * 100])
  })

  test('no panels resolves to the column rather than NaN', () => {
    const { sizes, height } = resolvePanelLayout({}, [], [], 600)
    expect(sizes).toEqual([])
    expect(height).toBe(600)
  })

  test('the drag floor stays low enough to grab the gutter', () => {
    expect(resolvePanelLayout({}, ['a', 'b', 'c', 'd'], [], 400).minSize).toBeLessThan(100 / 4)
  })
})

describe('clampDraggedHeights', () => {
  test('a drag that respects the floors is stored as dragged', () => {
    const mins = panelMinHeights(['a', 'b'])
    expect(clampDraggedHeights([70, 30], 600, mins)).toEqual([420, MIN])
  })

  test('a drag past a floor redistributes instead of growing the stack', () => {
    const mins = panelMinHeights(['a', 'b'])
    // user drags the first panel to 90%, crushing the second past its floor
    expect(clampDraggedHeights([90, 10], 600, mins)).toEqual([420, MIN])
  })

  test('the stack grows only when the floors alone need more room', () => {
    const mins = panelMinHeights(['a', 'b', 'c'])
    expect(clampDraggedHeights([80, 10, 10], 400, mins)).toEqual([MIN, MIN, MIN])
  })

  test('a collapsed panel keeps its header height through a drag', () => {
    const mins = panelMinHeights(['a', 'b'], ['a'])
    expect(mins).toEqual([COLLAPSED, MIN])
    expect(clampDraggedHeights([50, 50], 600, mins)[0]).toBe(300)
  })
})

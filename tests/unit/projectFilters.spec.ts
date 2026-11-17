import { expect, test } from '@playwright/test'
import { compareOrdered } from '../../src/pages/ProjectsPage/utils/compareOrdered'

const lt = (a: unknown, b: unknown) => compareOrdered(a, b, (order) => order < 0)
const gt = (a: unknown, b: unknown) => compareOrdered(a, b, (order) => order > 0)
const lte = (a: unknown, b: unknown) => compareOrdered(a, b, (order) => order <= 0)
const gte = (a: unknown, b: unknown) => compareOrdered(a, b, (order) => order >= 0)

test.describe('Projects: ordered comparisons', () => {
  test('a project without a value matches none of them', () => {
    for (const missing of [null, undefined, '']) {
      expect(lt(missing, 1), String(missing)).toBe(false)
      expect(gt(missing, 1), String(missing)).toBe(false)
      expect(lte(missing, 0), String(missing)).toBe(false)
      expect(gte(missing, 0), String(missing)).toBe(false)
      expect(gt(missing, '2026-01-01T00:00:00Z'), String(missing)).toBe(false)
      expect(lt(missing, '2026-01-01T00:00:00Z'), String(missing)).toBe(false)
    }
  })

  test('nothing to compare with matches nothing', () => {
    expect(gt(25, null)).toBe(false)
    expect(lt(25, undefined)).toBe(false)
    expect(gte('2026-01-01T00:00:00Z', '')).toBe(false)
  })

  test('zero is a value', () => {
    expect(lt(0, 1)).toBe(true)
    expect(lte(0, 0)).toBe(true)
    expect(gte(0, 0)).toBe(true)
    expect(gt(0, 1)).toBe(false)
  })

  test('numbers and dates compare by value', () => {
    expect(gt(25, 1)).toBe(true)
    expect(gt('25', 3)).toBe(true)
    expect(gt('2026-06-01T10:00:00+02:00', '2026-01-01T00:00:00Z')).toBe(true)
    expect(lt('2025-06-01T00:00:00Z', '2026-01-01T00:00:00Z')).toBe(true)
    // the same moment in two offsets
    expect(lte('2026-01-01T02:00:00+02:00', '2026-01-01T00:00:00Z')).toBe(true)
    expect(gte('2026-01-01T02:00:00+02:00', '2026-01-01T00:00:00Z')).toBe(true)
  })
})

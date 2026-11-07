import { expect, test } from '@playwright/test'
import {
  checkNumber,
  clampNumber,
  getNumberLimits,
  getNumberStep,
} from '../../src/containers/SettingsEditor/Widgets/TextWidgetHelpers'

test('reads inclusive limits and leaves exclusive ones to validation', () => {
  // SettingsField(0.5, ge=0.0, le=1.0)
  expect(getNumberLimits({ type: 'number', minimum: 0, maximum: 1 })).toEqual({ min: 0, max: 1 })
  // SettingsField(gt=0.0, le=100.0)
  expect(getNumberLimits({ type: 'number', exclusiveMinimum: 0, maximum: 100 })).toEqual({
    min: undefined,
    max: 100,
  })
  // draft 4 style boolean flags
  expect(
    getNumberLimits({ minimum: 0, exclusiveMinimum: true, maximum: 5, exclusiveMaximum: true }),
  ).toEqual({ min: undefined, max: undefined })
  expect(getNumberLimits({ type: 'number' })).toEqual({ min: undefined, max: undefined })
})

test('uses multipleOf as the step, and any step for decimals', () => {
  expect(getNumberStep({ type: 'number', multipleOf: 0.25 })).toBe(0.25)
  expect(getNumberStep({ type: 'number' })).toBe('any')
  expect(getNumberStep({ type: 'integer', multipleOf: 5 })).toBe(5)
  expect(getNumberStep({ type: 'integer' })).toBeUndefined()
})

test('clamps committed values into the limits', () => {
  const limits = { min: 0, max: 1 }
  expect(clampNumber('1.5', limits)).toBe(1)
  expect(clampNumber('-0.2', limits)).toBe(0)
  expect(clampNumber(-3, limits)).toBe(0)
  // in range and unfinished values stay untouched
  expect(clampNumber('0.5', limits)).toBe('0.5')
  expect(clampNumber('-', limits)).toBe('-')
  expect(clampNumber('250', { max: 100 })).toBe(100)
  expect(clampNumber('-250', { max: 100 })).toBe('-250')
})

test('checkNumber clamps and keeps the old behaviour without limits', () => {
  expect(checkNumber(0.5, '7', 'number', { min: 0, max: 1 })).toBe(1)
  expect(checkNumber(5, '12.9', 'integer', { min: 0, max: 10 })).toBe(10)
  expect(checkNumber(5, '-4', 'integer', { min: 0, max: 10 })).toBe(0)
  expect(checkNumber(undefined, '', 'integer', { min: 1 })).toBe(1)

  // no limits: same as before
  expect(checkNumber(3, '', 'integer')).toBe(3)
  expect(checkNumber(undefined, '', 'number')).toBe(0)
  expect(checkNumber(3, '12.9', 'integer')).toBe(12)
  expect(checkNumber(3, 'abc', 'integer')).toBe(0)
  expect(checkNumber(3, '1000.5', 'number')).toBe('1000.5')
})

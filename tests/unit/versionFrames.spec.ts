import { expect, test } from '@playwright/test'
import {
  formatVersionFrame,
  getVersionMediaStart,
  toStoredFrameRange,
} from '../../shared/src/containers/Feed/helpers/versionFrames'

test('the media starts at frameStart minus handleStart', () => {
  expect(getVersionMediaStart(1001, 5)).toBe(996)
  expect(getVersionMediaStart(1001, 0)).toBe(1001)
  expect(getVersionMediaStart(1001, undefined)).toBe(1001)
  expect(getVersionMediaStart(null, 5)).toBeNull()
  expect(getVersionMediaStart(undefined, 5)).toBeNull()
})

test('the first frame of the media is shown with its production frame number', () => {
  const mediaStart = getVersionMediaStart(1001, 5)
  expect(formatVersionFrame(1, mediaStart)).toBe('996')
  expect(formatVersionFrame(10, mediaStart)).toBe('1005')
})

test('without a frameStart, frames are shown as stored', () => {
  expect(formatVersionFrame(7, getVersionMediaStart(null, 5))).toBe('7')
})

test('a typed frame range is stored relative to the media start', () => {
  const mediaStart = getVersionMediaStart(1001, 5)
  expect(toStoredFrameRange({ startFrame: 996, endFrame: 1000 }, mediaStart)).toEqual({
    startFrame: 1,
    endFrame: 5,
  })
  // before the first media frame
  expect(toStoredFrameRange({ startFrame: 995, endFrame: 1000 }, mediaStart)).toBeNull()
})

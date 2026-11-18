import { expect, test } from '@playwright/test'
import { parseFrameRange } from '../../shared/src/containers/Feed/components/CommentInput/parseFrameRange'
import {
  formatVersionFrame,
  getVersionMediaStart,
  toStoredFrameRange,
} from '../../shared/src/containers/Feed/helpers/versionFrames'

test('unsigned frame input keeps accepting only positive frames', () => {
  expect(parseFrameRange('1')).toEqual({ startFrame: 1, endFrame: 1 })
  expect(parseFrameRange('3-7')).toEqual({ startFrame: 3, endFrame: 7 })
  expect(parseFrameRange('0')).toBeNull()
  expect(parseFrameRange('-4')).toBeNull()
  expect(parseFrameRange('7-3')).toBeNull()
})

test('signed frame input accepts zero and negative frames', () => {
  expect(parseFrameRange('0', { signed: true })).toEqual({ startFrame: 0, endFrame: 0 })
  expect(parseFrameRange('-4', { signed: true })).toEqual({ startFrame: -4, endFrame: -4 })
  expect(parseFrameRange('-4-10', { signed: true })).toEqual({ startFrame: -4, endFrame: 10 })
  expect(parseFrameRange('-4 - -1', { signed: true })).toEqual({ startFrame: -4, endFrame: -1 })
  expect(parseFrameRange('-1--4', { signed: true })).toBeNull()
  expect(parseFrameRange('abc', { signed: true })).toBeNull()
})

test('a frame shown as negative is stored as a valid frame', () => {
  // frameStart 1, handleStart 5: the media starts at -4, shown frames run from -4
  const mediaStart = getVersionMediaStart(1, 5)
  expect(mediaStart).toBe(-4)
  expect(formatVersionFrame(1, mediaStart)).toBe('-4')

  const typed = parseFrameRange('-4', { signed: true })
  expect(toStoredFrameRange(typed, mediaStart)).toEqual({ startFrame: 1, endFrame: 1 })
})

test('a typed range that reaches before the first media frame is rejected', () => {
  const mediaStart = getVersionMediaStart(1, 5)
  // -5 is before the first media frame, which is stored as frame 1
  expect(toStoredFrameRange(parseFrameRange('-5', { signed: true }), mediaStart)).toBeNull()
  expect(toStoredFrameRange(parseFrameRange('-5--2', { signed: true }), mediaStart)).toBeNull()
})

test('zero and negative frames map to the stored frames of the media', () => {
  // frameStart 1001, handleStart 5: first media frame 996
  const mediaStart = getVersionMediaStart(1001, 5)
  expect(toStoredFrameRange(parseFrameRange('996', { signed: true }), mediaStart)).toEqual({
    startFrame: 1,
    endFrame: 1,
  })
  // frame 0 is inside the media (stored 5) when the media starts at -4
  expect(
    toStoredFrameRange(parseFrameRange('0', { signed: true }), getVersionMediaStart(1, 5)),
  ).toEqual({
    startFrame: 5,
    endFrame: 5,
  })
})

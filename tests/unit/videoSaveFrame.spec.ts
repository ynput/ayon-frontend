import { expect, test } from '@playwright/test'
import {
  getFrameFileName,
  getStillTime,
  getStillUrl,
} from '../../src/containers/VideoPlayer/utils/saveFrame'

test('the still time falls inside the previous frame, so ffmpeg returns the frame itself', () => {
  for (const frameRate of [24, 24000 / 1001, 25, 30000 / 1001, 30, 60]) {
    for (let frame = 1; frame < 500; frame++) {
      const t = getStillTime(frame, frameRate)
      expect(t).toBeGreaterThan((frame - 1) / frameRate)
      expect(t).toBeLessThan(frame / frameRate)
    }
  }
  expect(getStillTime(0, 25)).toBe(0)
})

test('the still url is the file url plus /still and the time', () => {
  expect(getStillUrl('/api/projects/demo/files/abc', 10, 25)).toBe(
    '/api/projects/demo/files/abc/still?t=0.390000',
  )
  expect(getStillUrl('/api/projects/demo/files/abc?x=1', 0, 25)).toBe(
    '/api/projects/demo/files/abc/still?t=0.000000',
  )
})

test('the file name is the video name plus the frame number the player shows', () => {
  expect(getFrameFileName('turntable.mp4', 41)).toBe('turntable_0042.jpg')
  expect(getFrameFileName('my.shot.v003.mov', 0)).toBe('my.shot.v003_0001.jpg')
  expect(getFrameFileName(undefined, 9999)).toBe('frame_10000.jpg')
  expect(getFrameFileName('.mp4', 4)).toBe('frame_0005.jpg')
})

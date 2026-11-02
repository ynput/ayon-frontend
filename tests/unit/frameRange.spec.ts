import { expect, test } from '@playwright/test'
import { parseFrameRange } from '../../shared/src/containers/Feed/components/CommentInput/parseFrameRange'

test('parses single frames and inclusive ranges', () => {
  expect(parseFrameRange('1')).toEqual({ startFrame: 1, endFrame: 1 })
  expect(parseFrameRange(' 10 - 20 ')).toEqual({ startFrame: 10, endFrame: 20 })
  expect(parseFrameRange('20-20')).toEqual({ startFrame: 20, endFrame: 20 })
})

test('rejects invalid or out-of-order frame links', () => {
  for (const input of ['', '0', '-1', '20-10', '1-', '1.5', '1-2-3', '9007199254740992']) {
    expect(parseFrameRange(input)).toBeNull()
  }
})

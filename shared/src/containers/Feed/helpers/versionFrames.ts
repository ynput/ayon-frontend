import type { CommentFrameRange } from '@shared/context'

// comment frames are stored 1-based from the start of the version
const offset = (frameStart: number | null | undefined) =>
  typeof frameStart === 'number' && Number.isFinite(frameStart) ? frameStart - 1 : 0

export const formatVersionFrame = (frame: number, frameStart: number | null | undefined) =>
  String(frame + offset(frameStart))

export const toStoredFrameRange = (
  range: CommentFrameRange | null,
  frameStart: number | null | undefined,
): CommentFrameRange | null => {
  if (!range) return null
  const startFrame = range.startFrame - offset(frameStart)
  const endFrame = range.endFrame - offset(frameStart)
  return startFrame > 0 ? { startFrame, endFrame } : null
}

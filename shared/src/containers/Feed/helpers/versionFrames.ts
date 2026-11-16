import type { CommentFrameRange } from '@shared/context'

// The first frame of a version's media. The media includes the start handle,
// so it is frameStart - handleStart, not frameStart. Same as frame_start_handle
// in the Python pipeline. null when the version has no frameStart.
export const getVersionMediaStart = (
  frameStart: number | null | undefined,
  handleStart: number | null | undefined,
): number | null => {
  if (typeof frameStart !== 'number' || !Number.isFinite(frameStart)) return null
  const handles = typeof handleStart === 'number' && Number.isFinite(handleStart) ? handleStart : 0
  return frameStart - handles
}

// comment frames are stored 1-based from the first frame of the version's media
// (see getVersionMediaStart), so the display offset is the media start minus 1
const offset = (mediaStart: number | null | undefined) =>
  typeof mediaStart === 'number' && Number.isFinite(mediaStart) ? mediaStart - 1 : 0

export const formatVersionFrame = (frame: number, mediaStart: number | null | undefined) =>
  String(frame + offset(mediaStart))

export const toStoredFrameRange = (
  range: CommentFrameRange | null,
  mediaStart: number | null | undefined,
): CommentFrameRange | null => {
  if (!range) return null
  const startFrame = range.startFrame - offset(mediaStart)
  const endFrame = range.endFrame - offset(mediaStart)
  return startFrame > 0 ? { startFrame, endFrame } : null
}

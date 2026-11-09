import type { CommentFrameRange } from '@shared/context'

const FRAMES = /^(\d+)(?:\s*-\s*(\d+))?$/
// signed also takes zero and negative frames, which a version shows before its first media frame
const SIGNED_FRAMES = /^(-?\d+)(?:\s*-\s*(-?\d+))?$/

export const parseFrameRange = (
  value: string,
  { signed = false }: { signed?: boolean } = {},
): CommentFrameRange | null => {
  const match = (signed ? SIGNED_FRAMES : FRAMES).exec(value.trim())
  if (!match) return null
  const startFrame = Number(match[1])
  const endFrame = match[2] ? Number(match[2]) : startFrame
  const isFrame = (frame: number) => Number.isSafeInteger(frame) && (signed || frame > 0)
  return isFrame(startFrame) && isFrame(endFrame) && endFrame >= startFrame
    ? { startFrame, endFrame }
    : null
}

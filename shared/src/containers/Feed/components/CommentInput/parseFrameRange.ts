import type { CommentFrameRange } from '@shared/context'

export const parseFrameRange = (value: string): CommentFrameRange | null => {
  const match = /^(\d+)(?:\s*-\s*(\d+))?$/.exec(value.trim())
  if (!match) return null
  const startFrame = Number(match[1])
  const endFrame = match[2] ? Number(match[2]) : startFrame
  return Number.isSafeInteger(startFrame) &&
    startFrame > 0 &&
    Number.isSafeInteger(endFrame) &&
    endFrame >= startFrame
    ? { startFrame, endFrame }
    : null
}

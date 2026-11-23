import { FC } from 'react'
import type { TraitWidgetProps } from '../registry'
import { GenericTraitTable } from '../GenericTraitTable'
import {
  findTraitData,
  getFrameRange,
  getHandles,
  HANDLES_ID,
  numberField,
} from '../utils/traitFields'
import * as Views from './views.styled'

// These views read fields through utils/traitFields, which knows the trait versions (FrameRanged
// v1 stores fps as a string, v2 as a ratio). The timeline also reads the sibling Handles trait.

const formatFps = (fps: number) => `${Number.isInteger(fps) ? fps : fps.toFixed(3)} fps`

const formatDuration = (frames: number, fps: number | null): string | null => {
  if (!fps) return null
  const seconds = frames / fps
  const minutes = Math.floor(seconds / 60)
  return minutes ? `${minutes}m ${(seconds % 60).toFixed(1)}s` : `${seconds.toFixed(2)}s`
}

/** Timeline of FrameRanged: range, handles (outside, or inside when inclusive) and in/out. */
export const FrameRangeTimelineView: FC<TraitWidgetProps> = ({ data, traits }) => {
  const range = getFrameRange(data)
  if (!range) return <GenericTraitTable value={data} />

  const { start, end, frameIn, frameOut, step, fps } = range
  const handles = getHandles(findTraitData(traits, HANDLES_ID))
  const { inclusive } = handles
  const handleStart = handles.start
  const handleEnd = handles.end

  // the whole bar: handles outside the range unless they are part of it
  const barStart = inclusive ? start : start - handleStart
  const barEnd = inclusive ? end : end + handleEnd
  const total = barEnd - barStart + 1
  const span = (from: number, to: number) => ({
    left: `${((from - barStart) / total) * 100}%`,
    width: `${((to - from + 1) / total) * 100}%`,
  })

  const rangeStart = inclusive ? start + handleStart : start
  const rangeEnd = inclusive ? end - handleEnd : end
  const frames = end - start + 1
  const duration = formatDuration(frames, fps)

  return (
    <Views.View>
      <Views.Meta>
        <strong data-tooltip="FrameRanged:frame_start – FrameRanged:frame_end">
          {start}–{end}
        </strong>
        <span>
          <strong>{frames}</strong> frames{step && step > 1 ? ` (step ${step})` : ''}
        </span>
        {fps !== null && <strong>{formatFps(fps)}</strong>}
        {duration && <span>{duration}</span>}
        {(handleStart > 0 || handleEnd > 0) && (
          <span data-tooltip="Handles:frame_start_handle / Handles:frame_end_handle">
            handles {handleStart}/{handleEnd}
            {inclusive ? ' (inclusive)' : ''}
          </span>
        )}
      </Views.Meta>
      <Views.Timeline>
        {barStart < rangeStart && (
          <div
            className="part handle"
            style={span(barStart, rangeStart - 1)}
            data-tooltip={`Handle ${barStart}–${rangeStart - 1}`}
          />
        )}
        <div
          className="part range"
          style={span(rangeStart, rangeEnd)}
          data-tooltip={`Range ${rangeStart}–${rangeEnd}`}
        />
        {rangeEnd < barEnd && (
          <div
            className="part handle"
            style={span(rangeEnd + 1, barEnd)}
            data-tooltip={`Handle ${rangeEnd + 1}–${barEnd}`}
          />
        )}
        {(frameIn !== null || frameOut !== null) && (
          <div
            className="part inout"
            style={span(frameIn ?? barStart, frameOut ?? barEnd)}
            data-tooltip={`In/out ${frameIn ?? barStart}–${frameOut ?? barEnd}`}
          />
        )}
      </Views.Timeline>
      <Views.Axis>
        <span>{barStart}</span>
        <span>{barEnd}</span>
      </Views.Axis>
    </Views.View>
  )
}

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a)

/** PixelBased drawn as a frame with its aspect ratio. */
export const ResolutionView: FC<TraitWidgetProps> = ({ data }) => {
  const width = numberField(data, 'display_window_width')
  const height = numberField(data, 'display_window_height')
  if (!width || !height) return <GenericTraitTable value={data} />

  const par = numberField(data, 'pixel_aspect_ratio') || 1
  const aspect = (width * par) / height
  const displayWidth = Math.round(width * par)
  const divisor = gcd(displayWidth, height)
  const ratio = `${displayWidth / divisor}:${height / divisor}`
  // fits the frame in a 96x54 px box
  const boxWidth = aspect >= 16 / 9 ? 96 : Math.round(54 * aspect)
  const boxHeight = Math.round(boxWidth / aspect)

  return (
    <Views.ResolutionBox>
      <div className="frame" style={{ width: boxWidth, height: boxHeight }}>
        {aspect.toFixed(2)}
      </div>
      <Views.Meta>
        <strong data-tooltip="PixelBased:display_window_width × PixelBased:display_window_height">
          {width} × {height}
        </strong>
        <span>{ratio.length <= 7 ? ratio : `${aspect.toFixed(3)}:1`}</span>
        {par !== 1 && <span>pixel aspect {par}</span>}
      </Views.Meta>
    </Views.ResolutionBox>
  )
}

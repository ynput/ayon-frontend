import { FC, useMemo, useState } from 'react'
import clsx from 'clsx'
import { Button, Icon } from '@ynput/ayon-react-components'
import { copyToClipboard } from '@shared/util'
import type { TraitWidgetProps } from '../registry'
import { GenericTraitTable } from '../GenericTraitTable'
import * as Styled from '../RepresentationTraits.styled'
import * as Views from './views.styled'
import {
  buildStripSegments,
  FileEntry,
  findTrait,
  formatBytes,
  formatFrameRanges,
  getCommonDirectory,
  getMissingFrames,
  getSegmentTooltip,
  SEQUENCE_ID,
  shortHash,
  toFileEntries,
  withFrames,
} from './files'
import {
  findTraitData,
  FRAME_RANGED_ID,
  getFileLayout,
  getFrameRange,
  getTraitFiles,
  summarizeFiles,
} from '../utils/traitFields'

// rows of the file table shown before "Show all"
const TABLE_ROWS = 50

// expected frame range, from the sibling FrameRanged trait
const getExpectedRange = (traits: Record<string, unknown> | undefined) => {
  const range = getFrameRange(findTraitData(traits, FRAME_RANGED_ID))
  return range ? { start: range.start, end: range.end } : undefined
}

/**
 * Files of the trait read through its file layout, prepared for the views. The expected frame
 * range comes from FrameRanged, frame numbers from the Sequence regex, so missing frames can be
 * shown.
 */
const useFiles = ({ traitId, data, traits }: TraitWidgetProps) =>
  useMemo(() => {
    const layout = getFileLayout(traitId)
    const traitFiles = layout ? getTraitFiles(data, layout) : null
    if (!traitFiles) return null
    const files = withFrames(toFileEntries(traitFiles), findTrait(traits, SEQUENCE_ID))
    const range = files.every((file) => file.frame !== null) ? getExpectedRange(traits) : undefined
    return {
      files,
      range,
      directory: getCommonDirectory(files.map((file) => file.path)),
      summary: summarizeFiles(traitFiles),
      missing: getMissingFrames(files, range),
    }
  }, [traitId, data, traits])

type Files = NonNullable<ReturnType<typeof useFiles>>

const CopyButton: FC<{ text: string; tooltip: string }> = ({ text, tooltip }) => (
  <Button
    icon="content_copy"
    variant="text"
    data-tooltip={tooltip}
    onClick={() => copyToClipboard(text, true)}
  />
)

const FilesSummary: FC<{ files: Files }> = ({ files }) => {
  const frames = files.files.map((file) => file.frame).filter((f): f is number => f !== null)
  const { totalSize, extensions } = files.summary
  return (
    <Views.Meta>
      <span>
        <strong>{files.files.length}</strong> {files.files.length === 1 ? 'file' : 'files'}
      </span>
      {totalSize !== null && <strong>{formatBytes(totalSize)}</strong>}
      {extensions.length > 0 && <span>{extensions.map((ext) => `.${ext}`).join(' ')}</span>}
      {frames.length === files.files.length && frames.length > 0 && (
        <span>frames {formatFrameRanges(frames)}</span>
      )}
      {files.missing.length > 0 && (
        <span
          className="warning"
          data-tooltip={`Missing frames: ${formatFrameRanges(files.missing)}`}
        >
          {files.missing.length} missing
        </span>
      )}
      {files.directory && <code>{files.directory}</code>}
    </Views.Meta>
  )
}

/** Compact view: one bar, a cell per file. Cell height is the file size, hover shows path, size and hash. */
export const FilesStripView: FC<TraitWidgetProps> = (props) => {
  const { data } = props
  const files = useFiles(props)
  const segments = useMemo(
    () => (files ? buildStripSegments(files.files, 200, files.range) : []),
    [files],
  )
  if (!files) return <GenericTraitTable value={data} />
  if (!files.files.length) return <Styled.Empty>No files</Styled.Empty>

  const maxSize = Math.max(
    0,
    ...segments.map((segment) =>
      segment.kind === 'files' && segment.size !== null ? segment.size / segment.files.length : 0,
    ),
  )
  const first = segments[0]
  const last = segments[segments.length - 1]
  const firstFrame = first.frameStart
  const lastFrame = last.frameEnd

  return (
    <Views.View>
      <FilesSummary files={files} />
      <Views.Strip role="list">
        {segments.map((segment, index) => {
          const tooltip = getSegmentTooltip(segment)
          if (segment.kind === 'gap') {
            const width = segment.frameEnd - segment.frameStart + 1
            return (
              <Views.StripCell
                key={index}
                role="listitem"
                className="gap"
                style={{ flexGrow: width }}
                data-tooltip={tooltip}
                data-tooltip-as="pre"
              />
            )
          }
          const average = segment.size !== null ? segment.size / segment.files.length : null
          const height =
            average !== null && maxSize > 0 ? Math.max(8, (average / maxSize) * 100) : 100
          const width =
            segment.frameStart !== null && segment.frameEnd !== null
              ? segment.frameEnd - segment.frameStart + 1
              : segment.files.length
          return (
            <Views.StripCell
              key={index}
              role="listitem"
              className={clsx({ unknown: average === null })}
              style={{ flexGrow: width }}
              data-tooltip={tooltip}
              data-tooltip-as="pre"
            >
              <div className="fill" style={{ height: `${height}%` }} />
            </Views.StripCell>
          )
        })}
      </Views.Strip>
      {firstFrame !== null && lastFrame !== null && firstFrame !== lastFrame && (
        <Views.Axis>
          <span>{firstFrame}</span>
          <span>{lastFrame}</span>
        </Views.Axis>
      )}
    </Views.View>
  )
}

type Row = { kind: 'file'; file: FileEntry } | { kind: 'missing'; frames: number[] }

/** Detail view: every file with its size and hash, missing frames inline. */
export const FilesTableView: FC<TraitWidgetProps> = (props) => {
  const { data } = props
  const files = useFiles(props)
  const [showAll, setShowAll] = useState(false)

  const rows = useMemo<Row[]>(() => {
    if (!files) return []
    const missing = new Set(files.missing)
    const result: Row[] = []
    const pushMissing = (from: number, to: number) => {
      const frames: number[] = []
      for (let frame = from; frame <= to; frame++) if (missing.has(frame)) frames.push(frame)
      if (frames.length) result.push({ kind: 'missing', frames })
    }
    let previous = files.range ? files.range.start - 1 : null
    for (const file of files.files) {
      if (file.frame !== null && previous !== null) pushMissing(previous + 1, file.frame - 1)
      result.push({ kind: 'file', file })
      previous = file.frame
    }
    if (files.range && previous !== null) pushMissing(previous + 1, files.range.end)
    return result
  }, [files])

  if (!files) return <GenericTraitTable value={data} />
  if (!files.files.length) return <Styled.Empty>No files</Styled.Empty>

  const hasFrames = files.files.every((file) => file.frame !== null)
  const hasHash = files.files.some((file) => file.hash)
  const shown = showAll ? rows : rows.slice(0, TABLE_ROWS)

  return (
    <Views.View>
      <FilesSummary files={files} />
      <Views.FileTable>
        <thead>
          <tr>
            {hasFrames && <th>Frame</th>}
            <th>{files.directory ? 'Name' : 'Path'}</th>
            <th>Size</th>
            {hasHash && <th>Hash</th>}
            <th />
          </tr>
        </thead>
        <tbody>
          {shown.map((row, index) =>
            row.kind === 'missing' ? (
              <tr key={`missing-${index}`} className="missing">
                <td colSpan={hasHash ? 5 : 4}>
                  Missing {row.frames.length === 1 ? 'frame' : 'frames'}{' '}
                  {formatFrameRanges(row.frames)}
                </td>
              </tr>
            ) : (
              <tr key={row.file.path}>
                {hasFrames && <td className="number">{row.file.frame}</td>}
                <td className="name" data-tooltip={row.file.path}>
                  {files.directory ? row.file.path.slice(files.directory.length) : row.file.path}
                </td>
                <td className="number">{formatBytes(row.file.size)}</td>
                {hasHash && (
                  <td className="hash" data-tooltip={row.file.hash || undefined}>
                    {shortHash(row.file)}
                  </td>
                )}
                <td>
                  <CopyButton text={row.file.path} tooltip="Copy path" />
                </td>
              </tr>
            ),
          )}
        </tbody>
      </Views.FileTable>
      {rows.length > TABLE_ROWS && (
        <Styled.TextToggle type="button" onClick={() => setShowAll((value) => !value)}>
          {showAll ? 'Show less' : `Show all ${rows.length} rows`}
        </Styled.TextToggle>
      )}
    </Views.View>
  )
}

/** Compact view of a single file: name, directory, size and hash on one card. */
export const FileCardView: FC<TraitWidgetProps> = ({ traitId, data }) => {
  const layout = getFileLayout(traitId)
  const traitFiles = layout ? getTraitFiles(data, layout) : null
  if (!traitFiles || traitFiles.length !== 1) return <GenericTraitTable value={data} />
  const [file] = toFileEntries(traitFiles)
  const directory = file.path.slice(0, file.path.length - file.name.length)

  return (
    <Views.FileCard>
      <Icon icon="description" className="icon" />
      <div className="text">
        <span className="name">{file.name}</span>
        {directory && <span className="dir">{directory}</span>}
      </div>
      <Views.Meta>
        <strong>{formatBytes(file.size)}</strong>
        {file.hash && <Styled.Tag data-tooltip={file.hash}>{shortHash(file, 8)}</Styled.Tag>}
      </Views.Meta>
      <CopyButton text={file.path} tooltip="Copy path" />
    </Views.FileCard>
  )
}

import { KeyboardEvent, useEffect, useState } from 'react'
import clsx from 'clsx'
import { Icon } from '@ynput/ayon-react-components'
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { $Any } from '@types'
import { AddItemButton, RemoveItemButton } from './ArrayFieldTemplate.styled'
import {
  DESTINATION_FIELD,
  PathMappingData,
  PathPair,
  SOURCE_FIELD,
  addPair,
  getPathPairs,
  movePair,
  removePair,
  setPairValue,
  toPathMappingData,
} from './PathMappingHelpers'
import { useFieldOverride } from './useFieldOverride'
import * as Styled from './PathMappingField.styled'

type PathCellProps = {
  value: string
  label: string
  onCommit: (value: string) => void
}

// a path, saved when it loses focus or on Enter, like the settings' other text fields
const PathCell = ({ value, label, onCommit }: PathCellProps) => {
  const [draft, setDraft] = useState(value)
  useEffect(() => setDraft(value), [value])

  const commit = () => {
    if (draft !== value) onCommit(draft)
  }
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') e.currentTarget.blur()
  }

  return (
    <Styled.PathInput
      value={draft}
      aria-label={label}
      placeholder={label}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={onKeyDown}
    />
  )
}

type PathPairRowProps = {
  id: string
  index: number
  pair: PathPair
  labels: { source: string; destination: string }
  onChange: (index: number, side: keyof PathPair, value: string) => void
  onRemove: (index: number) => void
}

const PathPairRow = ({ id, index, pair, labels, onChange, onRemove }: PathPairRowProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  })

  return (
    <Styled.Pair
      ref={setNodeRef}
      className={clsx('settings-path-pair', isDragging && 'is-dragging')}
      style={{ transform: CSS.Translate.toString(transform), transition }}
    >
      <Styled.Handle type="button" aria-label="Move pair" {...attributes} {...listeners}>
        <Icon icon="drag_indicator" />
      </Styled.Handle>
      <PathCell
        value={pair.source}
        label={labels.source}
        onCommit={(value) => onChange(index, 'source', value)}
      />
      <Styled.Arrow aria-hidden>
        <Icon icon="arrow_forward" />
      </Styled.Arrow>
      <PathCell
        value={pair.destination}
        label={labels.destination}
        onCommit={(value) => onChange(index, 'destination', value)}
      />
      <RemoveItemButton
        className="remove-item"
        variant="text"
        icon="close"
        aria-label="Remove pair"
        data-tooltip="Remove pair"
        onClick={() => onRemove(index)}
      />
    </Styled.Pair>
  )
}

type PathMappingFieldProps = {
  /** The mapping object's field id */
  id: string
  schema: $Any
  formData: PathMappingData | undefined
  formContext: $Any
  onChange: (data: PathMappingData) => void
}

/**
 * A directory mapping drawn as pairs: each row maps a source path to a destination path.
 * The settings keep them as two lists matched by position (PathMappingHelpers), and every
 * edit writes both, so a pair can't come apart.
 */
export const PathMappingField = ({
  id,
  schema,
  formData,
  formContext,
  onChange,
}: PathMappingFieldProps) => {
  const pairs = getPathPairs(formData)
  const sourceId = `${id}_${SOURCE_FIELD}`
  const destinationId = `${id}_${DESTINATION_FIELD}`
  const source = useFieldOverride(sourceId, formContext, formData?.[SOURCE_FIELD])
  const destination = useFieldOverride(destinationId, formContext, formData?.[DESTINATION_FIELD])
  const labels = {
    source: schema.properties?.[SOURCE_FIELD]?.title || 'Source',
    destination: schema.properties?.[DESTINATION_FIELD]?.title || 'Destination',
  }

  const write = (next: PathPair[]) => {
    onChange(toPathMappingData(formData, next))
    // both lists are written, so both read as changed (Save skips an addon without any)
    const changed = [source.path, destination.path]
      .filter((path) => path.length)
      .map((path) => ({ path, isChanged: true }))
    if (changed.length) formContext.onSetChangedKeys?.(changed)
  }

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const from = pairs.findIndex((_, i) => `pair-${i}` === active.id)
    const to = pairs.findIndex((_, i) => `pair-${i}` === over.id)
    if (from >= 0 && to >= 0) write(movePair(pairs, from, to))
  }

  const ids = pairs.map((_, i) => `pair-${i}`)

  return (
    <Styled.Mapping className="settings-path-mapping">
      <Styled.Headings>
        <span />
        <Styled.Heading
          $level={source.overrideLevel}
          onClick={source.onSelect}
          onContextMenu={source.onContextMenu}
        >
          {labels.source}
        </Styled.Heading>
        <span />
        <Styled.Heading
          $level={destination.overrideLevel}
          onClick={destination.onSelect}
          onContextMenu={destination.onContextMenu}
        >
          {labels.destination}
        </Styled.Heading>
      </Styled.Headings>

      <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {pairs.map((pair, index) => (
            <PathPairRow
              key={ids[index]}
              id={ids[index]}
              index={index}
              pair={pair}
              labels={labels}
              onChange={(i, side, value) => write(setPairValue(pairs, i, side, value))}
              onRemove={(i) => write(removePair(pairs, i))}
            />
          ))}
        </SortableContext>
      </DndContext>

      <AddItemButton
        className="array-add-button"
        variant="text"
        icon="add"
        aria-label="Add a path pair"
        data-tooltip="Add a source and destination path"
        onClick={() => write(addPair(pairs))}
      />
    </Styled.Mapping>
  )
}

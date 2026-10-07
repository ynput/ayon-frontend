import { FC } from 'react'
import styled from 'styled-components'
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Icon } from '@ynput/ayon-react-components'
import type { SortingState } from '@tanstack/react-table'
import { MAX_SORT_KEYS } from '@shared/util/sortingHelpers'
import { SettingsPanelItem, SettingsPanelItemTemplate } from './SettingsPanelItemTemplate'

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-large);
`

const Section = styled.section`
  display: flex;
  flex-direction: column;
`

const SectionTitle = styled.div`
  font-weight: 500;
  color: var(--md-sys-color-outline);
  padding: 4px 0;
`

const List = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 2px;
  list-style-type: none;
  margin: 0;
  padding: 0;
`

const Hint = styled.span`
  color: var(--md-sys-color-outline);
  padding: 4px 0;
`

const SortItem = styled(SettingsPanelItemTemplate)`
  .drag-handle {
    cursor: grab;
    height: 20px;
  }

  &.dragging {
    position: relative;
    z-index: 1;
    background-color: var(--md-sys-color-surface-container-high);
    box-shadow: 0 0 4px 1px rgba(0, 0, 0, 0.1);

    .drag-handle {
      cursor: grabbing;
    }
  }
`

const AddItem = styled(SettingsPanelItemTemplate)`
  cursor: pointer;

  .action {
    color: var(--md-sys-color-outline);
  }
`

interface SortRowProps {
  item: SettingsPanelItem
  desc: boolean
  onToggleDirection: () => void
  onRemove: () => void
}

const SortRow: FC<SortRowProps> = ({ item, desc, onToggleDirection, onRemove }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.value,
  })

  return (
    <SortItem
      ref={setNodeRef}
      item={item}
      data-sort-id={item.value}
      className={isDragging ? 'dragging' : undefined}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      startContent={
        <div {...attributes} {...listeners} className="drag-handle">
          <Icon icon="drag_indicator" />
        </div>
      }
      actions={[
        {
          icon: desc ? 'arrow_downward' : 'arrow_upward',
          onClick: onToggleDirection,
          'data-tooltip': desc ? 'Descending' : 'Ascending',
        },
        {
          icon: 'close',
          onClick: onRemove,
          'data-tooltip': 'Remove',
        },
      ]}
    />
  )
}

export interface SortSettingsProps {
  // sort keys in order of precedence
  sorting: SortingState
  options: SettingsPanelItem[]
  onChange: (sorting: SortingState) => void
  maxKeys?: number
}

export const SortSettings: FC<SortSettingsProps> = ({
  sorting,
  options,
  onChange,
  maxKeys = MAX_SORT_KEYS,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  )

  // a sorted column can be missing from the options, it still has to be shown and removable
  const getItem = (id: string): SettingsPanelItem =>
    options.find((option) => option.value === id) ?? { value: id, label: id }

  const availableOptions = options.filter(
    (option) => !sorting.some((sort) => sort.id === option.value),
  )
  const canAdd = sorting.length < maxKeys

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const from = sorting.findIndex((sort) => sort.id === active.id)
    const to = sorting.findIndex((sort) => sort.id === over.id)
    if (from === -1 || to === -1) return
    onChange(arrayMove(sorting, from, to))
  }

  const toggleDirection = (id: string) =>
    onChange(sorting.map((sort) => (sort.id === id ? { ...sort, desc: !sort.desc } : sort)))

  const remove = (id: string) => onChange(sorting.filter((sort) => sort.id !== id))

  const add = (id: string) => onChange([...sorting, { id, desc: false }])

  return (
    <Container className="sort-settings">
      {sorting.length > 0 && (
        <Section className="sorted">
          <SectionTitle>Sorted by</SectionTitle>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sorting.map((sort) => sort.id)}
              strategy={verticalListSortingStrategy}
            >
              <List>
                {sorting.map((sort) => (
                  <SortRow
                    key={sort.id}
                    item={getItem(sort.id)}
                    desc={sort.desc}
                    onToggleDirection={() => toggleDirection(sort.id)}
                    onRemove={() => remove(sort.id)}
                  />
                ))}
              </List>
            </SortableContext>
          </DndContext>
        </Section>
      )}

      <Section className="available">
        <SectionTitle>{sorting.length > 0 ? 'Then sort by' : 'Sort by'}</SectionTitle>
        {canAdd ? (
          <List>
            {availableOptions.map((option) => (
              <AddItem
                key={option.value}
                item={option}
                data-sort-id={option.value}
                onClick={() => add(option.value)}
                actions={[{ icon: 'add' }]}
              />
            ))}
          </List>
        ) : (
          <Hint>Sorting is limited to {maxKeys} columns.</Hint>
        )}
      </Section>
    </Container>
  )
}

import { useMemo } from 'react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { CSS } from '@dnd-kit/utilities'
import { Button, Icon, SwitchButton } from '@ynput/ayon-react-components'
import { getColumnIcon, useColumnSettingsContext } from '@shared/containers/ProjectTreeTable'
import type { ProjectTableAttribute } from '@shared/containers/ProjectTreeTable'
import { getAttributeIcon } from '@shared/util/getAttributeIcon'
import * as ShellStyled from '@containers/MobileShell/MobileShell.styled'
import { SHEET_MASK_STYLE } from '@containers/MobileShell/MobileShellHelpers'
import * as Styled from './MobileCardFieldsSheet.styled'
import {
  getCardFieldCandidates,
  getColumnOrderIndex,
  isCardFieldShown,
  type TaskField,
} from './MobileTaskRowHelpers'

const getFieldIcon = (field: TaskField) =>
  field.kind === 'static'
    ? getColumnIcon(field.id)
    : getAttributeIcon(field.attribute.name, field.attribute.data.type, !!field.options.size)

type FieldRowProps = {
  field: TaskField
  isShown: boolean
  onToggle: (id: string) => void
}

const FieldRow = ({ field, isShown, onToggle }: FieldRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id })

  return (
    <Styled.FieldRow
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? 'dragging' : undefined}
    >
      <Styled.DragHandle
        type="button"
        ref={setActivatorNodeRef}
        aria-label={`Reorder ${field.label}`}
        {...attributes}
        {...listeners}
      >
        <Icon icon="drag_indicator" />
      </Styled.DragHandle>
      <SwitchButton
        label={
          <Styled.FieldLabel>
            <Icon icon={getFieldIcon(field)} />
            <span>{field.label}</span>
          </Styled.FieldLabel>
        }
        value={isShown}
        onClick={() => onToggle(field.id)}
      />
    </Styled.FieldRow>
  )
}

type Props = {
  visible: boolean
  onHide: () => void
  attribFields: ProjectTableAttribute[]
  hideEmpty: boolean
  onHideEmptyChange: (hideEmpty: boolean) => void
}

const MobileCardFieldsSheet = ({
  visible,
  onHide,
  attribFields,
  hideEmpty,
  onHideEmptyChange,
}: Props) => {
  const {
    columnVisibility,
    defaultColumnVisibility,
    columnOrder,
    updateColumnVisibility,
    updateColumnOrder,
  } = useColumnSettingsContext()

  const fields = useMemo(() => {
    const candidates = getCardFieldCandidates(attribFields)
    return candidates
      .map((field, definitionIndex) => ({ field, definitionIndex }))
      .sort(
        (a, b) =>
          getColumnOrderIndex(columnOrder, a.field.id) -
            getColumnOrderIndex(columnOrder, b.field.id) || a.definitionIndex - b.definitionIndex,
      )
      .map(({ field }) => field)
  }, [attribFields, columnOrder])

  const isShown = (id: string) => isCardFieldShown(columnVisibility, id, defaultColumnVisibility)
  const shownCount = fields.filter((field) => isShown(field.id)).length

  // write every field explicitly: a view without column choices would otherwise show them all
  const handleToggle = (id: string) => {
    const next = { ...columnVisibility }
    fields.forEach((field) => {
      next[field.id] = isShown(field.id)
    })
    next[id] = !isShown(id)
    updateColumnVisibility(next)
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  // card fields keep the slots they already hold among the table's other columns
  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const ids = fields.map((field) => field.id)
    const moved = arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id)))
    const fieldIds = new Set(ids)
    let index = 0
    const nextOrder = columnOrder.map((id) => (fieldIds.has(id) ? moved[index++] : id))
    updateColumnOrder([...nextOrder, ...moved.slice(index)])
  }

  return (
    <ShellStyled.Sheet
      position="bottom"
      visible={visible}
      onHide={onHide}
      showCloseIcon={false}
      blockScroll
      maskStyle={SHEET_MASK_STYLE}
    >
      <Styled.Header>
        <h2>View options</h2>
        <Button variant="text" onClick={onHide}>
          Done
        </Button>
      </Styled.Header>

      <Styled.Section>
        <Styled.SectionTitle>
          <span>Fields on the card</span>
          <span className="count">
            {shownCount} of {fields.length} shown
          </span>
        </Styled.SectionTitle>
        <Styled.Hint>Uses the columns of the current view. Drag to reorder.</Styled.Hint>

        <Styled.Group>
          <Styled.LockedRow>
            <Icon icon="lock" />
            <span>Name, thumbnail, status</span>
            <span className="always">Always</span>
          </Styled.LockedRow>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={fields.map((field) => field.id)}
              strategy={verticalListSortingStrategy}
            >
              {fields.map((field) => (
                <FieldRow
                  key={field.id}
                  field={field}
                  isShown={isShown(field.id)}
                  onToggle={handleToggle}
                />
              ))}
            </SortableContext>
          </DndContext>
        </Styled.Group>
      </Styled.Section>

      <Styled.Section>
        <Styled.Group>
          <SwitchButton
            label="Hide empty values"
            value={hideEmpty}
            onClick={() => onHideEmptyChange(!hideEmpty)}
          />
        </Styled.Group>
      </Styled.Section>
    </ShellStyled.Sheet>
  )
}

export default MobileCardFieldsSheet

import { useMemo, memo, useCallback, useRef, FC } from 'react'
import styled from 'styled-components'

// Widgets
import { BooleanWidget } from './BooleanWidget'
import { CollapsedWidget } from './CollapsedWidget'
import { DateWidget } from './DateWidget'
import { EnumWidget } from './EnumWidget'
import { TextWidget, TextWidgetType } from './TextWidget'

// Contexts
import { useCellEditing } from '../context/CellEditingContext'

// Utils
import { getCellId } from '../utils/cellUtils'
import clsx from 'clsx'
import { useSelectionCellsContext } from '../context/SelectionCellsContext'
import { AttributeData, AttributeEnumItem } from '../types'

const Cell = styled.div`
  position: absolute;
  inset: 0;
  padding: 4px 8px;
  display: flex;
  align-items: center;

  &:focus-visible {
    outline: none;
  }

  &.inherited {
    opacity: 0.6;
    font-style: italic;
  }

  &.loading {
    inset: 4px;
    border-radius: 4px;
    opacity: 1;
  }
`

type WidgetAttributeData = Pick<AttributeData, 'type'>

export type CellValue = string | number | boolean

interface EditorCellProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  rowId: string
  columnId: string
  value: CellValue | CellValue[]
  attributeData?: WidgetAttributeData
  options?: AttributeEnumItem[]
  isCollapsed?: boolean
  isInherited?: boolean
  isPlaceholder?: boolean
  isFocused?: boolean
  isReadOnly?: boolean
  enableCustomValues?: boolean
  onChange?: (value: CellValue | CellValue[], key?: 'Enter' | 'Click' | 'Escape') => void
}

export interface WidgetBaseProps {
  isEditing?: boolean
  onChange: Required<EditorCellProps>['onChange']
  onCancelEdit?: () => void
}

const EditorCellComponent: FC<EditorCellProps> = ({
  rowId,
  columnId,
  value,
  attributeData,
  options = [],
  isCollapsed,
  isInherited,
  isPlaceholder,
  isReadOnly,
  enableCustomValues,
  onChange,
  ...props
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const type = attributeData?.type

  const { isEditing, setEditingCellId } = useCellEditing()
  const { isCellFocused, gridMap, selectCell, focusCell } = useSelectionCellsContext()
  const cellId = getCellId(rowId, columnId)

  const isCurrentCellEditing = isEditing(cellId)
  const isCurrentCellFocused = isCellFocused(cellId)

  const handleDoubleClick = useCallback(() => {
    if (isPlaceholder || isReadOnly) return
    setEditingCellId(cellId)
  }, [cellId, setEditingCellId, isPlaceholder])

  const handleSingleClick = () => {
    // clicking a cell that is not editing will close the editor on this cell
    if (!isCurrentCellEditing) {
      setEditingCellId(null)
    }
  }

  const moveToNextRow = () => {
    const rowIndex = gridMap.rowIdToIndex.get(rowId)
    if (rowIndex === undefined) return
    const newRowId = gridMap.indexToRowId.get(rowIndex + 1)
    if (newRowId) {
      const newCellId = getCellId(newRowId, columnId)
      selectCell(newCellId, false, false)
      focusCell(newCellId)
      setEditingCellId(newCellId)
    }
  }

  const handleOnChange: WidgetBaseProps['onChange'] = (newValue, key) => {
    setEditingCellId(null)
    if (isReadOnly) return
    // move to the next cell row
    key === 'Enter' && moveToNextRow()
    // make change if the value is different or if the key is 'Enter'
    if (newValue !== value || key === 'Enter') {
      onChange?.(newValue, key)
    }
  }

  const handleCancel = () => {
    setEditingCellId(null)
  }

  const widget = useMemo(() => {
    // Common props shared across all widgets
    const sharedProps: WidgetBaseProps = {
      onChange: handleOnChange,
      onCancelEdit: handleCancel,
      isEditing: isCurrentCellEditing,
    }

    const textTypes: TextWidgetType[] = ['string', 'integer', 'float']

    // Determine widget type based on attribute type
    switch (true) {
      // this is showing the collapsed widget (dot)
      case isCollapsed: {
        // if enum, find the first selected option and get its color
        const firstSelectedOption = type?.includes('list')
          ? options.find((option) =>
              Array.isArray(value) ? value.includes(option.value) : value === option.value,
            )
          : undefined
        const color = firstSelectedOption?.color
        return <CollapsedWidget color={color} />
      }

      case !!options.length: {
        const enumValue = Array.isArray(value) ? value : [value]
        return (
          <EnumWidget
            value={enumValue}
            options={options}
            type={type}
            onOpen={() => !isReadOnly && setEditingCellId(cellId)}
            enableCustomValues={enableCustomValues}
            {...sharedProps}
          />
        )
      }

      case textTypes.includes(type as TextWidgetType):
        return <TextWidget value={value as string} isInherited={isInherited} {...sharedProps} />

      //case type === 'datetime' && value !== null && value !== undefined:
      case type === 'datetime':
        return <DateWidget value={value ? value as string : undefined} isInherited={isInherited} {...sharedProps} />

      case type === 'boolean':
        return <BooleanWidget value={value as boolean} {...sharedProps} />

      case isPlaceholder:
        return null

      default:
        // TODO: We should not allow editing unrecognized types
        // At this point, only list_of_strings without proper options is unrecognized
        // (tags if not tags are specified in anatomy) and in that case, validation
        // on the server fails with a string value. Unless we have a widget that 
        // accepts a string value AND options at the same time we shouldn't show
        // any edit widget

        //console.log(`Unrecognized type "${type}" for cell ${cellId}.`)
        return null
        // if the type is not recognized, fall back to the TextWidget
        //return <TextWidget value={value as string} {...sharedProps} />
    }
  }, [cellId, value, type, isCurrentCellEditing, options, isCollapsed])

  return (
    <Cell
      {...props}
      className={clsx(props.className, { inherited: isInherited && !isCurrentCellEditing })}
      ref={ref}
      onDoubleClick={handleDoubleClick}
      onClick={handleSingleClick}
      id={cellId}
      data-tooltip={
        isInherited && !isCurrentCellEditing && isCurrentCellFocused ? 'Inherited' : undefined
      }
      data-tooltip-delay={200}
    >
      {widget}
    </Cell>
  )
}

// Custom comparison function for memo
function arePropsEqual(prevProps: EditorCellProps, nextProps: EditorCellProps) {
  // Only re-render if these props change
  return (
    prevProps.rowId === nextProps.rowId &&
    prevProps.columnId === nextProps.columnId &&
    prevProps.isCollapsed === nextProps.isCollapsed &&
    JSON.stringify(prevProps.value) === JSON.stringify(nextProps.value) &&
    prevProps?.attributeData?.type === nextProps?.attributeData?.type &&
    // Only check options length for list types to avoid deep comparison
    ((!prevProps?.attributeData?.type.includes('list') &&
      !nextProps?.attributeData?.type.includes('list')) ||
      prevProps.options?.length === nextProps.options?.length) &&
    prevProps.isInherited === nextProps.isInherited &&
    prevProps.enableCustomValues === nextProps.enableCustomValues &&
    prevProps.isReadOnly === nextProps.isReadOnly &&
    prevProps.isPlaceholder === nextProps.isPlaceholder &&
    prevProps.isFocused === nextProps.isFocused &&
    prevProps.isCollapsed === nextProps.isCollapsed
  )
}

export const CellWidget = memo(EditorCellComponent, arePropsEqual)

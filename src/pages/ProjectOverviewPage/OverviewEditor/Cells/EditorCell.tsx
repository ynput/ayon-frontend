import { AttributeData, AttributeEnumItem } from '@api/rest/attributes'
import { forwardRef, useMemo, memo, useCallback } from 'react'
import styled from 'styled-components'
import { CollapsedWidget, DateWidget, EnumWidget, TextWidget } from '../Widgets'
import { useCellEditing } from '../context/CellEditingContext'
import clsx from 'clsx'
import { TextWidgetType } from '../Widgets/TextWidget'
import { getCellId } from '../utils/cellUtils'

const Cell = styled.div`
  position: absolute;
  inset: 0;
  padding: 4px 8px;
  display: flex;
  align-items: center;

  &.editing {
    /* light border around the outside */
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      border: 2px solid var(--md-sys-color-secondary-container);
      margin: -2px;
    }
  }
`

export type CellValue = string | number | boolean

interface EditorCellProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  rowId: string
  columnId: string
  value: CellValue | CellValue[]
  attributeData: AttributeData
  options: AttributeEnumItem[]
  isCollapsed: boolean
  onChange: (value: CellValue | CellValue[]) => void
}

const EditorCellComponent = forwardRef<HTMLDivElement, EditorCellProps>(
  ({ rowId, columnId, value, attributeData, options, isCollapsed, onChange, ...props }, ref) => {
    const { type } = attributeData

    const { isEditing, setEditingCellId } = useCellEditing()
    const cellId = getCellId(rowId, columnId)

    const isCurrentCellEditing = isEditing(cellId)

    const handleDoubleClick = useCallback(() => {
      setEditingCellId(cellId)
    }, [cellId, setEditingCellId])

    const widget = useMemo(() => {
      // Common props shared across all widgets
      const sharedProps = {
        onChange: (value: CellValue | CellValue[]) => {
          setEditingCellId(null)
          onChange(value)
        },
        onCancelEdit: () => setEditingCellId(null),
        isEditing: isCurrentCellEditing,
      }

      const textTypes: TextWidgetType[] = ['string', 'integer', 'float']

      // Determine widget type based on attribute type
      switch (true) {
        // this is showing the collapsed widget (dot)
        case isCollapsed: {
          // if enum, find the first selected option and get its color
          const firstSelectedOption = type.includes('list')
            ? options.find((option) =>
                Array.isArray(value) ? value.includes(option.value) : value === option.value,
              )
            : undefined
          const color = firstSelectedOption?.color
          return <CollapsedWidget color={color} />
        }

        case !!options.length: {
          const enumValue = Array.isArray(value) ? value : [value]
          return <EnumWidget value={enumValue} options={options} {...sharedProps} type={type} />
        }

        case textTypes.includes(type as TextWidgetType):
          return <TextWidget value={value as string} {...sharedProps} />

        case type === 'datetime' && value !== null && value !== undefined:
          return <DateWidget value={value as string} {...sharedProps} />

        default:
          return <TextWidget value={value as string} {...sharedProps} />
      }
    }, [value, type, isCurrentCellEditing, options, isCollapsed, setEditingCellId])

    return (
      <Cell
        {...props}
        ref={ref}
        onDoubleClick={handleDoubleClick}
        id={cellId}
        className={clsx({ editing: isCurrentCellEditing })}
      >
        {widget}
      </Cell>
    )
  },
)

// Custom comparison function for memo
function arePropsEqual(prevProps: EditorCellProps, nextProps: EditorCellProps) {
  // Only re-render if these props change
  return (
    prevProps.rowId === nextProps.rowId &&
    prevProps.columnId === nextProps.columnId &&
    prevProps.isCollapsed === nextProps.isCollapsed &&
    JSON.stringify(prevProps.value) === JSON.stringify(nextProps.value) &&
    prevProps.attributeData.type === nextProps.attributeData.type &&
    // Only check options length for list types to avoid deep comparison
    ((!prevProps.attributeData.type.includes('list') &&
      !nextProps.attributeData.type.includes('list')) ||
      prevProps.options.length === nextProps.options.length)
  )
}

export const EditorCell = memo(EditorCellComponent, arePropsEqual)

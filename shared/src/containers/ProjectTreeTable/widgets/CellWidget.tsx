import { useMemo, useCallback, useRef, FC } from 'react'
import styled from 'styled-components'

// Widgets
import { BooleanWidget, BooleanWidgetProps } from './BooleanWidget'
import { CollapsedWidget } from './CollapsedWidget'
import { DateWidget, DateWidgetProps } from './DateWidget'
import { EnumWidget, EnumWidgetProps } from './EnumWidget'
import { TextWidget, TextWidgetProps, TextWidgetType } from './TextWidget'
import { isLinkEditable, LinksWidget, LinkWidgetData } from './LinksWidget'

// Contexts
import { useCellEditing } from '../context/CellEditingContext'
import { useColumnSettingsContext } from '../context/ColumnSettingsContext'

// Utils
import { getCellId } from '../utils/cellUtils'
import clsx from 'clsx'
import { useSelectionCellsContext } from '../context/SelectionCellsContext'
import { AttributeData, AttributeEnumItem } from '../types'
import { useProjectTableContext } from '../context'
import { EnumCellValue } from './EnumCellValue'
import { NameWidget } from '@shared/containers/ProjectTreeTable/widgets/NameWidget'
import { NameWidgetData } from '@shared/components/RenameForm'

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

// use this class to trigger the editing mode on a single click
export const EDIT_TRIGGER_CLASS = 'edit-trigger'

type WidgetAttributeData = { type: AttributeData['type'] | 'links' | 'name' }

export type CellValue = string | number | boolean
export type CellValueData = Record<string, any>

interface EditorCellProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  rowId: string
  columnId: string
  value: CellValue | CellValue[]
  valueData?: CellValueData | CellValueData[] // extra data for the value
  attributeData?: WidgetAttributeData
  options?: AttributeEnumItem[]
  isCollapsed?: boolean
  isInherited?: boolean
  isPlaceholder?: boolean
  isFocused?: boolean
  isReadOnly?: boolean
  enableCustomValues?: boolean
  folderId?: string | null
  onChange?: (value: CellValue | CellValue[], key?: 'Enter' | 'Click' | 'Escape') => void
  // options passthrough props
  pt?: {
    enum?: Partial<EnumWidgetProps>
    text?: Partial<TextWidgetProps>
    date?: Partial<DateWidgetProps>
    boolean?: Partial<BooleanWidgetProps>
  }
  entityType?: string
}

export interface WidgetBaseProps {
  isEditing?: boolean
  onChange: Required<EditorCellProps>['onChange']
  onCancelEdit?: () => void
}

export const CellWidget: FC<EditorCellProps> = ({
  rowId,
  columnId,
  value,
  valueData,
  attributeData,
  options = [],
  isCollapsed,
  isInherited,
  isPlaceholder,
  isReadOnly,
  enableCustomValues,
  folderId,
  onChange,
  entityType,
  pt,
  ...props
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const type = attributeData?.type

  const { projectName } = useProjectTableContext()
  const { isEditing, setEditingCellId } = useCellEditing()
  const { isCellFocused, gridMap, selectCell, focusCell } = useSelectionCellsContext()
  const { rowHeight } = useColumnSettingsContext()
  const cellId = getCellId(rowId, columnId)

  const isCurrentCellEditing = isEditing(cellId)
  const isCurrentCellFocused = isCellFocused(cellId)

  const handleDoubleClick = useCallback(() => {
    if (isPlaceholder || isReadOnly) return
    setEditingCellId(cellId)
  }, [cellId, setEditingCellId, isPlaceholder, isReadOnly])

  const handleSingleClick = () => {
    // clicking a cell that is not editing will close the editor on this cell
    // NOTE: the selection of a cell is handled in ProjectTreeTable.tsx line 1079
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
    // ensure the browser focus moves back to the parent <td>
    const td = ref.current?.closest('td') as HTMLElement | null
    if (td) td.focus()
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
      case type === 'name': {
        return (
          <NameWidget
            value={value as CellValue}
            valueData={valueData as NameWidgetData}
            cellId={cellId}
            entityType={entityType || ''}
            {...sharedProps}
          />
        )
      }

      case type === 'links': {
        const linksValue = valueData as LinkWidgetData | undefined

        const isEditable = isLinkEditable(
          linksValue?.direction || 'out',
          linksValue?.link.linkType || '',
          linksValue?.entityType || '',
        )

        // overwrite readonly state if the cell is currently being edited
        isReadOnly = !isEditable
        return (
          <LinksWidget
            value={linksValue}
            cellId={cellId}
            projectName={projectName}
            disabled={!isEditable}
            folderId={folderId}
            {...sharedProps}
          />
        )
      }

      case !!options.length: {
        const enumValue = Array.isArray(value) ? value : [value]
        if (isReadOnly) {
          const selectedOptions = options.filter((option) => enumValue.includes(option.value))
          return (
            <EnumCellValue
              selectedOptions={selectedOptions}
              isReadOnly
              hasMultipleValues={enumValue.length > 1}
              isMultiSelect={type?.includes('list')}
              rowHeight={rowHeight}
            />
          )
        }
        return (
          <EnumWidget
            value={enumValue}
            options={options}
            type={type}
            onOpen={() => setEditingCellId(cellId)}
            enableCustomValues={enableCustomValues}
            {...sharedProps}
            {...pt?.enum}
          />
        )
      }

      case textTypes.includes(type as TextWidgetType):
        return (
          <TextWidget
            value={value as string}
            isInherited={isInherited}
            columnId={columnId}
            cellId={cellId}
            isSelected={isCurrentCellFocused}
            {...sharedProps}
            {...pt?.text}
          />
        )

      case type === 'datetime':
        return (
          <DateWidget
            value={value ? (value as string) : undefined}
            isInherited={isInherited}
            {...sharedProps}
            {...pt?.date}
          />
        )

      case type === 'boolean':
        return <BooleanWidget value={value as boolean} {...sharedProps} {...pt?.boolean} />

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
    }
  }, [cellId, value, type, isCurrentCellEditing, options, isCollapsed])

  return (
    <Cell
      {...props}
      className={clsx(props.className, {
        inherited: isInherited && !isCurrentCellEditing,
        readonly: isReadOnly,
        editable: !isReadOnly,
      })}
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

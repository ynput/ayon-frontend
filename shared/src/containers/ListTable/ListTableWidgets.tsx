import { AttributeData } from '@shared/api'
import { Cell, Row, RowData } from '@tanstack/react-table'
import { BooleanWidget } from '../ProjectTreeTable/widgets/BooleanWidget'
import { DateWidget } from '../ProjectTreeTable/widgets/DateWidget'
import { EnumWidget } from '../ProjectTreeTable/widgets/EnumWidget'
import { TextWidget, TextWidgetType } from '../ProjectTreeTable/widgets/TextWidget'

export type ListTableAttributeType = NonNullable<AttributeData['type']>

export type ListTableColumnAttributeData = Partial<Record<string, AttributeData>>

export interface ListTableWidgetRenderContext<TData extends RowData> {
  row: Row<TData>
  cell: Cell<TData, unknown>
  value: unknown
  rowIndex: number
  columnId: string
  cellId: string
  attributeData: AttributeData
  isEditing: boolean
  isReadOnly: boolean
  startEditing: () => void
  stopEditing: () => void
  updateValue: (value: unknown) => void
  openViewer: () => void
  getDraftValue: () => string | null
  setDraftValue: (value: string | null) => void
}

export type ListTableWidgetRenderer<TData extends RowData> = (
  context: ListTableWidgetRenderContext<TData>,
) => React.ReactNode

export type ListTableDataTypeWidgets<TData extends RowData> = Partial<
  Record<ListTableAttributeType, ListTableWidgetRenderer<TData>>
>

const isEnumAttribute = (attributeData?: AttributeData) => !!attributeData?.enum?.length

const stringifyScalarValue = (value: unknown) => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) return value.join(', ')

  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

const renderEnumWidget = <TData extends RowData>({
  value,
  attributeData,
  isEditing,
  isReadOnly,
  startEditing,
  stopEditing,
  updateValue,
}: ListTableWidgetRenderContext<TData>) => {
  const enumValue = Array.isArray(value)
    ? (value as (string | number | boolean)[])
    : value === null || value === undefined
    ? []
    : [value as string | number | boolean]

  return (
    <EnumWidget
      value={enumValue}
      //   @ts-expect-error -- just between icon prop
      options={attributeData.enum || []}
      type={attributeData.type}
      isEditing={isEditing}
      isReadOnly={isReadOnly}
      onOpen={startEditing}
      onCancelEdit={stopEditing}
      onChange={(nextValue) => updateValue(nextValue)}
    />
  )
}

const textWidgetRenderer = <TData extends RowData>(
  context: ListTableWidgetRenderContext<TData>,
) => {
  if (isEnumAttribute(context.attributeData)) {
    return renderEnumWidget(context)
  }

  return (
    <TextWidget
      value={stringifyScalarValue(context.value)}
      type={context.attributeData.type as TextWidgetType}
      columnId={context.columnId}
      cellId={context.cellId}
      isEditing={context.isEditing}
      isReadOnly={context.isReadOnly}
      onRequestEdit={() => context.startEditing()}
      onCancelEdit={context.stopEditing}
      onChange={(nextValue) => context.updateValue(nextValue)}
      getDraftValue={context.getDraftValue}
      setDraftValue={context.setDraftValue}
    />
  )
}

const booleanWidgetRenderer = <TData extends RowData>(
  context: ListTableWidgetRenderContext<TData>,
) => {
  return (
    <BooleanWidget
      value={Boolean(context.value)}
      isEditing={context.isEditing}
      isReadOnly={context.isReadOnly}
      onCancelEdit={context.stopEditing}
      onChange={(nextValue) => context.updateValue(nextValue)}
    />
  )
}

const dateWidgetRenderer = <TData extends RowData>(
  context: ListTableWidgetRenderContext<TData>,
) => {
  return (
    <DateWidget
      value={typeof context.value === 'string' ? context.value : undefined}
      isEditing={context.isEditing}
      isReadOnly={context.isReadOnly}
      onCancelEdit={context.stopEditing}
      onChange={(nextValue) => context.updateValue(nextValue)}
    />
  )
}

const listWidgetRenderer = <TData extends RowData>(
  context: ListTableWidgetRenderContext<TData>,
) => {
  if (isEnumAttribute(context.attributeData)) {
    return renderEnumWidget(context)
  }

  return stringifyScalarValue(context.value)
}

const fallbackWidgetRenderer = <TData extends RowData>(
  context: ListTableWidgetRenderContext<TData>,
) => stringifyScalarValue(context.value)

export const defaultListTableDataTypeWidgets: ListTableDataTypeWidgets<any> = {
  string: textWidgetRenderer,
  integer: textWidgetRenderer,
  float: textWidgetRenderer,
  boolean: booleanWidgetRenderer,
  datetime: dateWidgetRenderer,
  list_of_strings: listWidgetRenderer,
  list_of_integers: listWidgetRenderer,
  list_of_any: listWidgetRenderer,
  list_of_submodels: fallbackWidgetRenderer,
  dict: fallbackWidgetRenderer,
}

export const getDefaultListTableDataTypeWidgets = <TData extends RowData>() =>
  defaultListTableDataTypeWidgets as ListTableDataTypeWidgets<TData>

export const getListTableCellId = (rowId: string, columnId: string) =>
  `list-table-cell-${rowId}-${columnId}`

export const renderListTableFallbackValue = (value: unknown) => stringifyScalarValue(value)

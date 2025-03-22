import { AttributeModel } from '@api/rest/attributes'
import { FC, useState } from 'react'
import styled from 'styled-components'
import { CellValue } from '../../../../containers/ProjectTreeTable/widgets/CellWidget'
import { TextWidget } from '../../../../containers/ProjectTreeTable/widgets/TextWidget'
import { BooleanWidget } from '../../../../containers/ProjectTreeTable/widgets/BooleanWidget'
import { DateWidget } from '../../../../containers/ProjectTreeTable/widgets/DateWidget'
import { EnumWidget } from '../../../../containers/ProjectTreeTable/widgets/EnumWidget'
import clsx from 'clsx'
import copyToClipboard from '@helpers/copyToClipboard'
import { Button } from '@ynput/ayon-react-components'

export type AttributeField = Omit<AttributeModel, 'position' | 'scope' | 'builtin'> & {
  readonly?: boolean
  hidden?: boolean
}

interface DetailsPanelAttributesEditorProps {
  isLoading?: boolean // show loading shimmer for 20 placeholder items
  enableEditing?: boolean // if this is false, everything is readonly
  fields: AttributeField[] // the schema for the form
  form: Record<
    string,
    string | number | boolean | Date | any[] | Record<string, any> | undefined | null
  > // the form data

  onChange?: (key: string, value: any) => void
}

const StyledForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  height: 100%;
`

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 150px 1fr auto;
  gap: 0px;
  align-items: center;
  padding: 4px 0;
  min-height: 32px;
  position: relative;

  .copy-icon {
    opacity: 0;

    &:hover {
      background-color: var(--md-sys-color-surface-container-low-hover);
    }
  }

  &:hover .copy-icon {
    opacity: 1;
  }
`

const FieldLabel = styled.div`
  color: var(--md-sys-color-on-surface-variant);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-left: 4px;
`

const FieldValue = styled.div`
  height: 32px;
  overflow: hidden;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  border-radius: 4px;
  padding: 0 4px;

  &:not(.readonly) {
    cursor: pointer;
  }

  &:hover:not(.readonly) {
    background-color: var(--md-sys-color-surface-container-low-hover);
  }

  .dropdown .button {
    background-color: unset;
  }

  &.editing {
    background-color: var(--md-sys-color-surface-container);
    cursor: default;
  }
`

const FieldValueText = styled.div`
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: right;

  input {
    text-align: right;
  }
`

const ShimmerRow = styled(FormRow)`
  .shimmer {
    width: 100%;
    height: 24px;
    border-radius: 4px;
  }
`

const DetailsPanelAttributesEditor: FC<DetailsPanelAttributesEditorProps> = ({
  isLoading,
  form,
  fields,
  enableEditing,
  onChange,
}) => {
  const [editingField, setEditingField] = useState<string | null>(null)

  // Handler for starting to edit a field
  const handleStartEditing = (fieldName: string) => {
    if (enableEditing && !fields.find((field) => field.name === fieldName)?.readonly) {
      setEditingField(fieldName)
    }
  }

  // Handler for field value changes
  const handleValueChange = (fieldName: string, value: CellValue | CellValue[]) => {
    setEditingField(null)
    onChange?.(fieldName, value)
  }

  const handleCancelEdit = () => {
    setEditingField(null)
  }

  if (isLoading) {
    return (
      <StyledForm>
        {Array.from({ length: 10 }).map((_, index) => (
          <ShimmerRow key={index}>
            <div className="loading"></div>
            <div className="loading"></div>
          </ShimmerRow>
        ))}
      </StyledForm>
    )
  }

  return (
    <StyledForm>
      {fields
        .filter((f) => !f.hidden)
        .map((field) => {
          const fieldValue = form[field.name]
          const isEditing = editingField === field.name
          const isReadOnly = field.readonly || !enableEditing

          return (
            <FormRow key={field.name}>
              <FieldLabel title={field.data.description || field.data.title || field.name}>
                {field.data.title || field.name}
              </FieldLabel>
              <FieldValue
                className={clsx({ editing: isEditing, readonly: isReadOnly })}
                onClick={() => !isEditing && handleStartEditing(field.name)}
              >
                {renderFieldWidget(
                  field,
                  fieldValue,
                  isEditing,
                  isReadOnly,
                  handleValueChange,
                  handleCancelEdit,
                )}
              </FieldValue>
              <Button
                className="copy-icon"
                variant="text"
                icon="content_copy"
                onClick={(e) => {
                  e.stopPropagation()
                  const valueToDisplay =
                    fieldValue === null || fieldValue === undefined ? '' : fieldValue
                  copyToClipboard(valueToDisplay.toString(), true)
                }}
              />
            </FormRow>
          )
        })}
    </StyledForm>
  )
}

// Helper function to render the appropriate widget based on field type
const renderFieldWidget = (
  field: AttributeField,
  value: any,
  isEditing: boolean,
  isReadOnly: boolean,
  onChange: (fieldName: string, value: CellValue | CellValue[]) => void,
  onCancelEdit: () => void,
) => {
  const { type } = field.data
  const widgetCommonProps = {
    isEditing: isEditing && !isReadOnly,
    isInherited: false,
    onChange: (newValue: CellValue | CellValue[]) => onChange(field.name, newValue),
    onCancelEdit,
  }

  // Format the value for display
  let displayValue = value === null || value === undefined ? '' : value

  // Handle different field types
  switch (true) {
    case type === 'boolean':
      return (
        <BooleanWidget value={Boolean(displayValue)} {...widgetCommonProps} style={{ margin: 0 }} />
      )

    case type === 'datetime':
      return (
        <DateWidget
          value={displayValue.toString()}
          {...widgetCommonProps}
          isEditing
          style={{ width: 'fit-content' }}
        />
      )

    case !!field.data.enum?.length: {
      const isListType = type.includes('list')
      const valueArray = isListType
        ? Array.isArray(displayValue)
          ? displayValue
          : []
        : [displayValue]

      return (
        <EnumWidget
          value={valueArray}
          options={field.data.enum || []}
          type={type}
          onOpen={() => !isReadOnly && onChange(field.name, displayValue)}
          pt={{ template: { style: { height: 32, backgroundColor: 'unset' }, className: 'enum' } }}
          {...widgetCommonProps}
        />
      )
    }

    case type === 'string' || type === 'integer' || type === 'float':
    default:
      return (
        <FieldValueText>
          <TextWidget value={displayValue.toString()} {...widgetCommonProps} />
        </FieldValueText>
      )
  }
}

export default DetailsPanelAttributesEditor

import type { AttributeModel } from '@shared/api'
import { copyToClipboard } from '@shared/util'
import { FC, useState, useMemo, useEffect } from 'react'
import styled from 'styled-components'
import { CellValue } from '@shared/containers/ProjectTreeTable/widgets/CellWidget'
import clsx from 'clsx'
import { Button } from '@ynput/ayon-react-components'
import RenderFieldWidget from './components/RenderFieldWidget'
import { BorderedSection } from '../DetailsPanelDetails/BorderedSection'
import { FieldLabel } from '../DetailsPanelDetails/FieldLabel'

const FormRow = styled.div`
  display: grid;
  grid-template-columns: minmax(150px, 1fr) 1fr 32px;
  row-gap: 2px;
  column-gap: 4px;
  align-items: center;
  min-height: 32px;
  position: relative;

  .copy-icon {
    opacity: 0;
    width: 32px;
    height: 32px;
    padding: 2px;

    &:hover {
      background-color: transparent !important;
    }
  }

  &:hover .copy-icon {
    opacity: 1;
  }
`

const FieldValue = styled.div`
  height: 32px;
  overflow: hidden;
  width: 100%;
  justify-self: start;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  border-radius: 4px;
  padding: 0 4px;
  text-align: left;
  position: relative;
  z-index: 1;

  &:not(.readonly) {
    cursor: pointer;
    pointer-events: auto;
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
    justify-content: flex-start;
  }

  &.readonly {
    pointer-events: none;
  }
`

const ShimmerRow = styled(FormRow)`
  &.loading {
    width: 100%;
    height: 33px;
    min-height: unset;
    border-radius: 4px;
    margin-bottom: 4px;
  }
`

export type AttributeField = Omit<AttributeModel, 'position' | 'scope' | 'builtin'> & {
  readonly?: boolean
  hidden?: boolean
  enableCustomValues?: boolean // Allow custom values in enum fields
  enableSearch?: boolean // Enable search functionality in enum fields
  allowNone?: boolean // Allow "None" option for enum fields that can be cleared
}

export interface DetailsPanelAttributesEditorProps {
  title?: string
  isLoading?: boolean // show loading shimmer for 20 placeholder items
  enableEditing?: boolean // if this is false, everything is readonly
  fields: AttributeField[] // the schema for the form
  form: Record<
    string,
    string | number | boolean | Date | any[] | Record<string, any> | undefined | null
  > // the form data
  mixedFields?: string[] // when multiple entities are selected, this is a list of fields that are mixed
  onChange?: (key: string, value: any) => void
  entities?: any[] // entities data for scoped statuses
  entityType?: string // entity type for scoped statuses
}

export const DetailsPanelAttributesEditor: FC<DetailsPanelAttributesEditorProps> = ({
  title,
  isLoading,
  form,
  fields,
  enableEditing,
  mixedFields,
  onChange,
  entities = [],
  entityType = 'task',
}) => {
  const [editingField, setEditingField] = useState<string | null>(null)

  const entitySelectionKey = useMemo(
    () => entities.map((entity) => entity?.id).join('|'),
    [entities],
  )

  useEffect(() => {
    setEditingField(null)
  }, [entitySelectionKey])

  const handleStartEditing = (fieldName: string) => {
    if (enableEditing && !fields.find((field) => field.name === fieldName)?.readonly) {
      setEditingField(fieldName)
    } else {
      console.log('Editing not allowed:', {
        enableEditing,
        fieldReadonly: fields.find((field) => field.name === fieldName)?.readonly,
      })
    }
  }

  const handleValueChange = (fieldName: string, value: CellValue | CellValue[]) => {
    setEditingField(null)
    onChange?.(fieldName, value)
  }

  const handleCancelEdit = () => {
    setEditingField(null)
  }

  if (isLoading) {
    return (
      <BorderedSection title="Attributes" withPadding>
        {Array.from({ length: 10 }).map((_, index) => (
          <ShimmerRow key={index}>
            <div className="loading"></div>
            <div className="loading"></div>
          </ShimmerRow>
        ))}
      </BorderedSection>
    )
  }

  return (
    <BorderedSection
      title="Attributes"
      autoHeight
      showHeader
      withPadding
      pt={{ content: { style: { minHeight: 'unset' } } }}
    >
      {fields
        .filter((f) => !f.hidden)
        .map((field) => {
          const fieldValue = form[field.name]
          const isEditing = editingField === field.name
          const isReadOnly = field.readonly || !enableEditing
          const isMixed = mixedFields?.includes(field.name) || false

          return (
            <FormRow key={field.name}>
              <FieldLabel name={field.name} data={field.data} showDetailedTooltip />
              <FieldValue
                className={clsx({ editing: isEditing, readonly: isReadOnly })}
                onClick={(e) => {
                  // Allow links to work normally - don't intercept clicks on anchor elements
                  if ((e.target as HTMLElement).closest('a')) {
                    return
                  }
                  e.preventDefault()
                  if (!isEditing && !isReadOnly && field.data.type !== 'boolean') {
                    handleStartEditing(field.name)
                  }
                }}
              >
                <RenderFieldWidget
                  field={field}
                  value={fieldValue}
                  isEditing={isEditing}
                  isReadOnly={isReadOnly}
                  isMixed={isMixed}
                  onChange={handleValueChange}
                  onCancelEdit={handleCancelEdit}
                  entities={entities}
                  entityType={entityType}
                />
              </FieldValue>
              <Button
                className="copy-icon"
                variant="text"
                icon="content_copy"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  const valueToDisplay =
                    fieldValue === null || fieldValue === undefined ? '' : fieldValue
                  copyToClipboard(valueToDisplay.toString(), true)
                }}
              />
            </FormRow>
          )
        })}
    </BorderedSection>
  )
}

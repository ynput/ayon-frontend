import type { AttributeModel } from '@shared/api'
import { copyToClipboard } from '@shared/util'
import { FC, useState } from 'react'
import styled from 'styled-components'
import { CellValue } from '@shared/containers/ProjectTreeTable/widgets/CellWidget'
import clsx from 'clsx'
import { Button } from '@ynput/ayon-react-components'
import RenderFieldWidget from './components/RenderFieldWidget'
import { BorderedSection } from '../DetailsPanelDetails/BorderedSection'

const StyledContent = styled.div`
  padding: 8px;
`

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 120px 1fr 40px;
  gap: 0px;
  align-items: center;
  min-height: 37px;
  position: relative;

  .copy-icon {
    opacity: 0;
    width: 32px;
    height: 32px;
    min-width: 32px;
    min-height: 32px;

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
  .shimmer {
    width: 100%;
    height: 24px;
    border-radius: 4px;
  }
`

export type AttributeField = Omit<AttributeModel, 'position' | 'scope' | 'builtin'> & {
  readonly?: boolean
  hidden?: boolean
}

export interface DetailsPanelAttributesEditorProps {
  isLoading?: boolean // show loading shimmer for 20 placeholder items
  enableEditing?: boolean // if this is false, everything is readonly
  fields: AttributeField[] // the schema for the form
  form: Record<
    string,
    string | number | boolean | Date | any[] | Record<string, any> | undefined | null
  > // the form data
  mixedFields?: string[] // when multiple entities are selected, this is a list of fields that are mixed
  onChange?: (key: string, value: any) => void
}

export const DetailsPanelAttributesEditor: FC<DetailsPanelAttributesEditorProps> = ({
  isLoading,
  form,
  fields,
  enableEditing,
  mixedFields,
  onChange,
}) => {
  const [editingField, setEditingField] = useState<string | null>(null)

  const handleStartEditing = (fieldName: string) => {
    if (enableEditing && !fields.find((field) => field.name === fieldName)?.readonly) {
      setEditingField(fieldName)
    } else {
      console.log('Editing not allowed:', { enableEditing, fieldReadonly: fields.find((field) => field.name === fieldName)?.readonly })
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
      <BorderedSection title="Attributes">
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
    <BorderedSection title="Attributes">
      {fields
        .filter((f) => !f.hidden)
        .map((field) => {
          const fieldValue = form[field.name]
          const isEditing = editingField === field.name
          const isReadOnly = field.readonly || !enableEditing
          const isMixed = mixedFields?.includes(field.name) || false

          return (
            <FormRow key={field.name}>
              <FieldLabel title={field.data.description || field.data.title || field.name}>
                {field.data.title || field.name}
              </FieldLabel>
              <FieldValue
                className={clsx({ editing: isEditing, readonly: isReadOnly })}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (!isEditing && !isReadOnly) {
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

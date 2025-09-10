import type { AttributeModel } from '@shared/api'
import { copyToClipboard } from '@shared/util'
import { FC, useState } from 'react'
import styled from 'styled-components'
import { CellValue } from '@shared/containers/ProjectTreeTable/widgets/CellWidget'
import clsx from 'clsx'
import { Button } from '@ynput/ayon-react-components'
import RenderFieldWidget from './components/RenderFieldWidget'

const StyledForm = styled.div`
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  height: 100%;
`

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 150px 1fr auto;
  gap: 0px;
  align-items: center;
  min-height: 37px;
  position: relative;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);

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
  width: fit-content;
  min-width: 160px;
  max-width: 100%;
  justify-self: end;
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

const ShimmerRow = styled(FormRow)`
  .shimmer {
    width: 100%;
    height: 24px;
    border-radius: 4px;
  }
`

// TODO: move styles to a separate file

export type AttributeField = Omit<AttributeModel, 'position' | 'scope' | 'builtin'> & {
  readonly?: boolean
  hidden?: boolean
  enableCustomValues?: boolean // Allow custom values in enum fields
  enableSearch?: boolean // Enable search functionality in enum fields
  allowNone?: boolean // Allow "None" option for enum fields that can be cleared
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
          const isMixed = mixedFields?.includes(field.name) || false

          return (
            <FormRow key={field.name}>
              <FieldLabel title={field.data.description || field.data.title || field.name}>
                {field.data.title || field.name}
              </FieldLabel>
              <FieldValue
                className={clsx({ editing: isEditing, readonly: isReadOnly })}
                onClick={() => !isEditing && handleStartEditing(field.name)}
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

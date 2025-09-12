import { FC } from 'react'
import styled from 'styled-components'
import type { CellValue } from '@shared/containers/ProjectTreeTable/widgets/CellWidget'
import { TextWidget } from '@shared/containers/ProjectTreeTable/widgets/TextWidget'
import { BooleanWidget } from '@shared/containers/ProjectTreeTable/widgets/BooleanWidget'
import { DateWidget } from '@shared/containers/ProjectTreeTable/widgets/DateWidget'
import { EnumWidget } from '@shared/containers/ProjectTreeTable/widgets/EnumWidget'
// Import AttributeField as a type to avoid runtime circular dependency with DetailsPanelAttributesEditor
import type { AttributeField } from '../DetailsPanelAttributesEditor'

const FieldValueText = styled.div`
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: right;

  input {
    text-align: left;
  }
`

const StyledEnumWidget = styled(EnumWidget)`
  .enum {
    &:hover {
      background-color: unset;
    }
  }
  &:hover {
    background-color: unset;
  }
`

interface RenderFieldWidgetProps {
  field: AttributeField
  value: any
  isEditing: boolean
  isReadOnly: boolean
  isMixed: boolean
  onChange: (fieldName: string, value: CellValue | CellValue[]) => void
  onCancelEdit: () => void
}

const RenderFieldWidget: FC<RenderFieldWidgetProps> = ({
  field,
  value,
  isEditing,
  isReadOnly,
  isMixed,
  onChange,
  onCancelEdit,
}) => {
  const { type } = field.data
  const widgetCommonProps = {
    isEditing: isEditing && !isReadOnly,
    isInherited: false,
    onChange: (newValue: CellValue | CellValue[]) => onChange(field.name, newValue),
  }

  // Format the value for display
  let displayValue = value === null || value === undefined ? '' : value
  const labelValue = field.data.title || field.name

  // Handle different field types
  switch (true) {
    case type === 'boolean':
      return (
        <BooleanWidget
          value={Boolean(displayValue)}
          {...widgetCommonProps}
          style={{ margin: 0 }}
          onClick={() => onChange(field.name, !Boolean(displayValue))}
          isReadOnly={isReadOnly}
        />
      )

    case type === 'datetime':
      return (
        <DateWidget
          value={displayValue}
          {...widgetCommonProps}
          isEditing
          onCancelEdit={onCancelEdit}
          style={{ width: 'fit-content' }}
          autoFocus={false}
        />
      )

    case !!field.data.enum?.length: {
      const isListType = type.includes('list')
      let valueArray = []

      if (isListType) {
        valueArray = Array.isArray(displayValue) ? displayValue : []
      } else if (isMixed) {
        valueArray = []
      } else {
        valueArray = [displayValue]
      }

      return (
        <StyledEnumWidget
          value={valueArray}
          options={field.data.enum || []}
          type={type}
          pt={{
            template: {
              style: { height: 32 },
              className: 'enum',
            },
          }}
          placeholder={isMixed ? `Mixed ${labelValue}` : `Select ${labelValue}...`}
          onClose={onCancelEdit}
          align="right"
          isReadOnly={isReadOnly}
          {...widgetCommonProps}
        />
      )
    }

    case type === 'string' || type === 'integer' || type === 'float':
    default:
      return (
        <FieldValueText>
          <TextWidget
            value={displayValue.toString()}
            onCancelEdit={onCancelEdit}
            type={type as 'string' | 'integer' | 'float'}
            {...widgetCommonProps}
          />
        </FieldValueText>
      )
  }
}

export default RenderFieldWidget

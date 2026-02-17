import { FC } from 'react'
import styled from 'styled-components'
import type { CellValue } from '@shared/containers/ProjectTreeTable/widgets/CellWidget'
import { TextWidget } from '@shared/containers/ProjectTreeTable/widgets/TextWidget'
import { BooleanWidget } from '@shared/containers/ProjectTreeTable/widgets/BooleanWidget'
import { DateWidget } from '@shared/containers/ProjectTreeTable/widgets/DateWidget'
import { EnumWidget } from '@shared/containers/ProjectTreeTable/widgets/EnumWidget'
import type { AttributeEnumItem } from '@shared/containers/ProjectTreeTable/types'
import { useScopedStatuses, useScopedTypes } from '@shared/hooks'
// Import AttributeField as a type to avoid runtime circular dependency with DetailsPanelAttributesEditor
import type { AttributeField } from '../DetailsPanelAttributesEditor'
import type { DetailsPanelEntityData } from '@shared/api'

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
  .enum,
  .edit-trigger {
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
  entities?: DetailsPanelEntityData[]
  entityType?: string
}

const RenderFieldWidget: FC<RenderFieldWidgetProps> = ({
  field,
  value,
  isEditing,
  isReadOnly,
  isMixed,
  onChange,
  onCancelEdit,
  entities = [],
  entityType = 'task',
}) => {
  const { type } = field.data
  const widgetCommonProps = {
    isEditing: isEditing && !isReadOnly,
    isInherited: false,
    onChange: (newValue: CellValue | CellValue[]) => onChange(field.name, newValue),
  }

  // Hooks must be called at top level - not inside conditions
  const projectNames = entities.map((entity) => entity.projectName)
  const scopedStatuses = useScopedStatuses(projectNames, [entityType])
  const scopedTypes = useScopedTypes(projectNames, entityType)

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

    case !!field.data.enum: {
      const isListType = type?.includes('list')
      let valueArray = []

      if (isListType) {
        valueArray = Array.isArray(displayValue) ? displayValue : []
      } else if (isMixed) {
        valueArray = []
      } else {
        valueArray = [displayValue]
      }

      // Use scoped statuses/types based on field name
      let enumOptions: AttributeEnumItem[] = (field.data.enum || []).map((item) => ({
        value: item.value,
        label: item.label,
        icon: typeof item.icon === 'string' ? item.icon : undefined,
        color: item.color,
      }))
      if (field.name === 'status' && entities.length > 0 && scopedStatuses && scopedStatuses.length > 0) {
        enumOptions = scopedStatuses.map((status) => ({
          value: status.name,
          label: status.name,
          icon: status.icon,
          color: status.color,
        }))
      }
      if (field.name === 'taskType' && entities.length > 0 && scopedTypes && scopedTypes.length > 0) {
        enumOptions = scopedTypes.map((t) => ({
          value: t.name,
          label: t.name,
          icon: t.icon,
          color: t.color,
        }))
      }

      if (field.allowNone && !!valueArray.length && !isListType) {
        // Check if current field has a value (for single value fields)
        const hasCurrentValue = displayValue && displayValue !== ''
        if (hasCurrentValue) {
          enumOptions = [
            { value: '', label: `No ${field.data.title || field.name}` },
            ...enumOptions,
          ]
        }
      }

      return (
        <StyledEnumWidget
          value={valueArray}
          options={enumOptions}
          type={type}
          pt={{
            template: {
              style: { height: 32 },
              className: 'enum',
            },
          }}
          placeholder={isMixed ? `Mixed ${labelValue}` : `Select ${labelValue}...`}
          onCancelEdit={onCancelEdit}
          align="right"
          isReadOnly={isReadOnly}
          enableCustomValues={field.enableCustomValues ?? false}
          search={field.enableSearch ?? enumOptions.length>=5}
          sortBySelected={!enumOptions}
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

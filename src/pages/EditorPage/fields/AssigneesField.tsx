import { AssigneeSelect, AssigneeSelectProps } from '@ynput/ayon-react-components'
import { union } from 'lodash'
import { FC } from 'react'

interface AssigneesFieldProps extends AssigneeSelectProps {
  multipleValues: string[][] | null
  onFieldChange: (value: string | string[], changeKey: string, field: string) => void
  changeKey: string
  field: string
  isChanged: boolean
  allUsers: { name: string; fullName: string; avatarUrl: string }[]
}

const AssigneesField: FC<AssigneesFieldProps> = ({
  value,
  multipleValues,
  options,
  placeholder,
  disabled,
  onFieldChange,
  changeKey,
  field,
  isChanged,
  ...props
}) => {
  const hasMultipleValues = multipleValues && multipleValues.length > 0

  return (
    <AssigneeSelect
      {...props}
      value={multipleValues ? union(...multipleValues) : value || []}
      options={options}
      isMultiple={!!hasMultipleValues}
      placeholder={placeholder}
      disabled={disabled}
      emptyMessage={'None assigned'}
      emptyIcon={null}
      onChange={(v) => onFieldChange(v, changeKey, field)}
      buttonStyle={{
        border: '1px solid var(--md-sys-color-outline-variant)',
        overflow: 'hidden',
      }}
      isChanged={isChanged}
      widthExpand
    />
  )
}

export default AssigneesField

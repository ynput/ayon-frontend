import { DropdownRef, EnumDropdown } from '@ynput/ayon-react-components'
import { $Any } from '@types'
import { union } from 'lodash'
import { LegacyRef } from 'react'

type Props = {
  attrib: $Any
  value: $Any
  parentValue: $Any
  multipleValues: $Any
  placeholder: string
  isOwn: boolean
  isMultiSelect: boolean
  isChanged: boolean
  reference?: LegacyRef<DropdownRef> | undefined
  onChange: (added: string[], removed: string[]) => null
  onAddItem: (value: string) => null
}

const EnumRow = ({
  attrib,
  value,
  parentValue,
  placeholder,
  multipleValues,
  isOwn,
  isMultiSelect,
  isChanged,
  reference,
  onChange,
  onAddItem,
}: Props) => {
  const getInheritLabel = (
    attrib: $Any,
    parentValue: $Any,
    isMultiSelect: boolean,
  ): string | undefined => {
    if (!parentValue) {
      return
    }
    if (!isMultiSelect) {
      return (
        'inherited - ' + attrib.enum.filter((el: $Any) => el.value === parentValue)[0]?.label ||
        undefined
      )
    }
    const labels = attrib.enum
      ?.filter((el: $Any) => parentValue.includes(el.value))
      .map((el: $Any) => el.label || el.value)
    return `inherited - (${labels.join(', ')})`
  }

  let enumValue = isMultiSelect ? value : [value]
  if (multipleValues) {
    enumValue = isMultiSelect ? union(...multipleValues) : multipleValues
  }

  let options = attrib.enum
  const inheritedOptionLabel = getInheritLabel(attrib, parentValue, isMultiSelect)
  if (inheritedOptionLabel) {
    placeholder = inheritedOptionLabel
    options = [{ value: null, label: inheritedOptionLabel }, ...attrib.enum]
  }

  // never show value when inherited, just show placeholder
  if (!isOwn) {
    enumValue = null
  }

  return (
    <EnumDropdown
      value={enumValue || []}
      isChanged={isChanged}
      options={options}
      onChange={onChange}
      onAddItem={onAddItem}
      multiSelect={isMultiSelect}
      emptyMessage={`Select option${isMultiSelect ? 's' : ''}...`}
      search={attrib?.enum?.length > 10}
      placeholder={placeholder}
      nullPlaceholder={inheritedOptionLabel}
      ref={reference}
      style={{
        flexGrow: 1,
        fontStyle: isOwn ? 'normal' : 'italic',
        color: isChanged
          ? 'var(--color-on-changed)'
          : !isOwn
          ? 'var (--md-sys-color-outline)'
          : 'var(--md-sys-color-on-surface-variant)',
      }}
      itemStyle={{
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
      widthExpand
      widthExpandMax
    />
  )
}
export default EnumRow

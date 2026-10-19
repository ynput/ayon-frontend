import { DropdownRef, TagsSelect } from '@ynput/ayon-react-components'
import clsx from 'clsx'
import { useEffect, useMemo, useRef } from 'react'
import styled from 'styled-components'
import type { EnumItem } from '@shared/api'
import type { WidgetBaseProps } from './CellWidget'
import { EnumCellValue, EnumTemplateProps } from './EnumCellValue'

// the colour TagsSelect gives tags that have none, a hex so the chip text colour can be worked out
const NO_COLOR_TAG = '#353B46'

const StyledTagsSelect = styled(TagsSelect)`
  width: 100%;
  height: 100%;
`

export interface TagsWidgetProps extends WidgetBaseProps {
  value: (string | number | boolean)[]
  // the anatomy tags
  options: EnumItem[]
  placeholder?: string
  align?: 'left' | 'right'
  className?: string
  pt?: {
    template?: Partial<EnumTemplateProps>
  }
}

export const TagsWidget = ({
  value,
  options,
  isEditing,
  isReadOnly,
  onChange,
  onCancelEdit,
  placeholder,
  align,
  className,
  pt,
}: TagsWidgetProps) => {
  const valueKey = JSON.stringify(value)
  const values = useMemo(
    () => value.map((v) => v?.toString()).filter((v): v is string => !!v),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [valueKey],
  )
  // the anatomy tags with their colours, then the values that are not in the anatomy
  const tags = useMemo(() => {
    const result: Record<string, { name: string; color: string }> = {}
    for (const option of options) {
      const name = option.value.toString()
      result[name] = { name, color: option.color || '' }
    }
    for (const name of values) if (!result[name]) result[name] = { name, color: '' }
    return result
  }, [options, values])
  const isEditable = !!isEditing && !isReadOnly

  const dropdownRef = useRef<DropdownRef>(null)
  useEffect(() => {
    if (isEditable && dropdownRef.current && !dropdownRef.current.isOpen) {
      dropdownRef.current.open()
    }
  }, [isEditable])

  if (isEditable) {
    return (
      <StyledTagsSelect
        ref={dropdownRef}
        value={values}
        tags={tags}
        options={[]}
        editor
        align={align}
        placeholder={placeholder}
        onChange={(names) => onChange(names, 'Click')}
        onClose={onCancelEdit}
        className={className}
      />
    )
  }

  const selectedOptions = values.map(
    (v) =>
      options.find((option) => option.value === v) ?? {
        value: v,
        label: v,
        color: NO_COLOR_TAG,
      },
  )

  return (
    <EnumCellValue
      selectedOptions={selectedOptions}
      hasMultipleValues={selectedOptions.length > 1}
      isMultiSelect
      isReadOnly={isReadOnly}
      placeholder={placeholder}
      {...pt?.template}
      className={clsx('enum-value', pt?.template?.className, className)}
    />
  )
}

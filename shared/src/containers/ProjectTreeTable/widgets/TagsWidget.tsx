import { DropdownRef, TagsSelect, type DropdownProps } from '@ynput/ayon-react-components'
import clsx from 'clsx'
import { useEffect, useMemo, useRef } from 'react'
import styled from 'styled-components'
import type { EnumItem } from '@shared/api'
import { useProjectTags } from '@shared/hooks/useProjectTags'
import { useCreateProjectTag } from '@shared/hooks/useCreateProjectTag'
import type { WidgetBaseProps } from './CellWidget'
import { EnumCellValue, EnumTemplateProps } from './EnumCellValue'

// the colour TagsSelect gives tags that have none, a hex so the chip text colour can be worked out
const NO_COLOR_TAG = '#353B46'

const StyledTagsSelect = styled(TagsSelect)`
  width: 100%;
  height: 100%;
`

export interface TagsWidgetProps
  // editing the tags of several entities, see the ARC Dropdown
  extends Pick<DropdownProps, 'mixedCounts' | 'mixedTotal' | 'mixedLabel' | 'onMixedChange'>,
    WidgetBaseProps {
  value: (string | number | boolean)[]
  // the anatomy tags
  options: EnumItem[]
  projectName?: string
  placeholder?: string
  align?: 'left' | 'right'
  className?: string
  // the project's tags field: managers can save a tag without a colour to the project with one
  canAddToProject?: boolean
  pt?: {
    template?: Partial<EnumTemplateProps>
  }
}

export const TagsWidget = ({
  value,
  options,
  projectName,
  isEditing,
  isReadOnly,
  onChange,
  onCancelEdit,
  placeholder,
  align,
  className,
  canAddToProject,
  pt,
  ...mixedProps
}: TagsWidgetProps) => {
  const valueKey = JSON.stringify(value)
  const values = useMemo(
    () => value.map((v) => v?.toString()).filter((v): v is string => !!v),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [valueKey],
  )
  const anatomyTags = useMemo(
    () => options.map((option) => ({ name: option.value.toString(), color: option.color })),
    [options],
  )
  const isEditable = !!isEditing && !isReadOnly
  const tags = useProjectTags({
    projectName,
    anatomyTags,
    values,
    skip: !isEditable,
  })

  const onCreateTag = useCreateProjectTag(canAddToProject ? projectName : undefined)

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
        onCreateTag={onCreateTag}
        createTagLabel="Add to project tags"
        {...mixedProps}
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

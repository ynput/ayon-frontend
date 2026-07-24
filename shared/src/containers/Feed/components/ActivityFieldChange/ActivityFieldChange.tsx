import React, { useMemo } from 'react'
import * as Styled from './ActivityFieldChange.styled'
import ActivityDate from '../ActivityDate'
import { Icon } from '@ynput/ayon-react-components'
import useGetContextParents from './hooks/getContextParents'
import { FieldValue } from './FieldValue'
import { useGetAttributeListQuery } from '@shared/api'
import type { AttributeModel, EnumItem } from '@shared/api'
import { formatUTCDate } from '@shared/util/formatUTCDate'

type FieldDisplayValue = {
  name: string
  icon?: string
  color?: string
  items?: { label: string; color?: string }[]
}

const getEnumDisplay = (item: EnumItem): FieldDisplayValue => {
  const icon = typeof item.icon === 'string' ? item.icon : item.icon?.name
  const color = item.color ?? (typeof item.icon === 'object' ? item.icon?.color : undefined)
  return { name: item.label, icon, color }
}

const formatSingleValue = (value: unknown, attribute?: AttributeModel): string => {
  const enumLabel = attribute?.data.enum?.find((e) => e.value === value)?.label
  if (enumLabel) return enumLabel
  if (attribute?.data.type === 'datetime') {
    const date = new Date(String(value))
    if (!isNaN(date.getTime())) return formatUTCDate(date, 'dd-MM-yyyy')
  }
  return String(value)
}

const formatValue = (value: unknown, attribute?: AttributeModel): FieldDisplayValue => {
  const isEmpty =
    value === null || value === undefined || value === '' || (Array.isArray(value) && !value.length)
  if (isEmpty) return { name: 'none' }

  if (attribute?.data.type === 'boolean') return { name: value ? 'Checked' : 'Unchecked' }

  const values = Array.isArray(value) ? value : [value]
  if (values.length === 1) {
    const enumItem = attribute?.data.enum?.find((e) => e.value === values[0])
    if (enumItem) return getEnumDisplay(enumItem)
  }

  return { name: values.map((v) => formatSingleValue(v, attribute)).join(', ') }
}

interface ActivityFieldChangeProps {
  entityType?: string
  projectInfo?: {
    tags?: { name: string; color?: string }[]
    [key: string]: any
  }
  activity: {
    activityType?: string
    authorName?: string
    authorFullName?: string
    createdAt?: string
    oldStatus?: FieldDisplayValue
    newStatus?: FieldDisplayValue
    activityData?: {
      key?: string
      oldValue?: unknown
      newValue?: unknown
    }
    [key: string]: any
  }
}

const ActivityFieldChange: React.FC<ActivityFieldChangeProps> = ({
  entityType,
  projectInfo,
  activity = {},
}) => {
  const {
    activityType,
    authorName,
    authorFullName,
    createdAt,
    oldStatus,
    newStatus,
    activityData = {},
  } = activity
  const { key, oldValue, newValue } = activityData
  const tagList = useGetContextParents(activity, entityType)

  const isAttrib = activityType === 'attrib.change'
  const isTags = activityType === 'tags.change'
  const isTypeChange = activityType === 'type.change'

  const { data: attributes = [] } = useGetAttributeListQuery(undefined, { skip: !isAttrib })
  const attribute = useMemo(() => attributes.find((a) => a.name === key), [attributes, key])

  const fieldTitle = isAttrib ? attribute?.data.title || key : isTags ? 'Tags' : isTypeChange ? 'Type' : undefined

  const statusDisplay = (status?: FieldDisplayValue): FieldDisplayValue => ({
    name: status?.name || '',
    icon: status?.icon,
    color: status?.color,
  })

  const tagsDisplay = (value: unknown): FieldDisplayValue => {
    const tags = Array.isArray(value) ? value.map(String) : []
    if (!tags.length) return { name: 'none' }
    const items = tags.map((tag) => ({
      label: tag,
      color: projectInfo?.tags?.find((t) => t.name === tag)?.color,
    }))
    return { name: tags.join(', '), items }
  }

  const isStatus = activityType === 'status.change'
  const getDisplay = (value: unknown, status?: FieldDisplayValue): FieldDisplayValue => {
    if (isStatus) return statusDisplay(status)
    if (isTags) return tagsDisplay(value)
    return formatValue(value, attribute)
  }

  const oldDisplay = getDisplay(oldValue, oldStatus)
  const newDisplay = getDisplay(newValue, newStatus)

  return (
    <Styled.FieldChange>
      <Styled.Body>
        <Styled.Text>{authorFullName || authorName}</Styled.Text>
        <Styled.Text>- {tagList.join(' / ')} -</Styled.Text>
        {fieldTitle && (
          <Styled.Text>
            <strong>{fieldTitle}</strong>
          </Styled.Text>
        )}
        <FieldValue {...oldDisplay} />
        <Icon icon="trending_flat" />
        <FieldValue {...newDisplay} />
      </Styled.Body>
      <ActivityDate date={createdAt} />
    </Styled.FieldChange>
  )
}

export default ActivityFieldChange

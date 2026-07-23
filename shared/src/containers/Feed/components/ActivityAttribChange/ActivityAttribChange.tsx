import React, { useMemo } from 'react'
import * as Styled from '../ActivityStatusChange/ActivityStatusChange.styled'
import ActivityDate from '../ActivityDate'
import { Icon } from '@ynput/ayon-react-components'
import useGetContextParents from '../ActivityStatusChange/hooks/getContextParents'
import { useGetAttributeListQuery } from '@shared/api'
import type { AttributeModel } from '@shared/api'
import { formatUTCDate } from '@shared/util/formatUTCDate'

const formatSingleValue = (value: unknown, attribute?: AttributeModel): string => {
  const enumLabel = attribute?.data.enum?.find((e) => e.value === value)?.label
  if (enumLabel) return enumLabel
  if (attribute?.data.type === 'datetime') {
    const date = new Date(String(value))
    if (!isNaN(date.getTime())) return formatUTCDate(date, 'dd-MM-yyyy')
  }
  return String(value)
}

const formatValue = (value: unknown, attribute?: AttributeModel): string => {
  if (value === null || value === undefined || value === '') return 'none'
  const values = Array.isArray(value) ? value : [value]
  return values.map((v) => formatSingleValue(v, attribute)).join(', ')
}

interface ActivityAttribChangeProps {
  entityType?: string
  activity: {
    authorName?: string
    authorFullName?: string
    createdAt?: string
    activityData?: {
      key?: string
      oldValue?: unknown
      newValue?: unknown
    }
    [key: string]: any
  }
}

const ActivityAttribChange: React.FC<ActivityAttribChangeProps> = ({
  entityType,
  activity = {},
}) => {
  const { authorName, authorFullName, createdAt, activityData = {} } = activity
  const { key, oldValue, newValue } = activityData
  const tagList = useGetContextParents(activity, entityType)

  const { data: attributes = [] } = useGetAttributeListQuery()
  const attribute = useMemo(() => attributes.find((a) => a.name === key), [attributes, key])

  return (
    <Styled.StatusChange>
      <Styled.Body>
        <Styled.Text>{authorFullName || authorName}</Styled.Text>
        <Styled.Text>- {tagList.join(' / ')} -</Styled.Text>
        <Styled.Text>
          <strong>{attribute?.data.title || key}</strong>
        </Styled.Text>
        <Styled.Text>{formatValue(oldValue, attribute)}</Styled.Text>
        <Icon icon="trending_flat" />
        <Styled.Text>{formatValue(newValue, attribute)}</Styled.Text>
      </Styled.Body>
      <ActivityDate date={createdAt} />
    </Styled.StatusChange>
  )
}

export default ActivityAttribChange

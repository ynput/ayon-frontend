// Various comoonents for formatting fields in the UI

import { getTagColor, getStatusColor } from '/src/utils'
import styled from 'styled-components'

// Tags

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`

const TagsField = ({ value }) => {
  if (!value?.length) return '-'

  return (
    <TagsContainer>
      {value.map((tag) => (
        <span key={tag} style={{ color: getTagColor(tag) }}>
          {tag}
        </span>
      ))}
    </TagsContainer>
  )
}

// Status

const StatusField = ({ value }) => {
  if (!value) return '\u00A0'
  return <span style={{ color: getStatusColor(value) }}>{value}</span>
}

// Datetime

const DateTimeContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 8px;
  align-items: center;
  > span:first-child {
    color: var(--color-text-dim);
  }
`

const TimestampField = ({ value }) => {
  const date = new Date(value * 1000)
  const [dd, tt] = date.toISOString().slice(0, 19).split('T')
  return (
    <DateTimeContainer>
      <span>{dd}</span>
      <span>{tt}</span>
    </DateTimeContainer>
  )
}


// PATH

const PathContainer = styled.div`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const PathField = ({ value }) => {
  if (!value) return '\u00A0'
  return(
    <PathContainer>
      {value}
    </PathContainer>
  )
}


export { TagsField, StatusField, TimestampField, PathField }

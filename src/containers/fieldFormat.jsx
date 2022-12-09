// Various comoonents for formatting fields in the UI

import { getTagColor, getStatusColor } from '/src/utils'
import styled from 'styled-components'


// Attributes


const AttributeField = ({ value }) => {

}


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

const timestampToTime = (timestamp) => {
  // convert unix timestamp (in seconds) to a list ["YYYY-MM-DD", "HH:MM:SS"]
  // assume timestamp is in UTC, return local time
  //
  if (!timestamp) return ['-', '-']
  const jsTimestamp = Math.trunc(timestamp * 1000)
  
  const date = new Date(jsTimestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return [`${year}-${month}-${day}`, `${hours}:${minutes}:${seconds}`]
}


const TimestampField = ({ value }) => {
  const [dd, tt] = timestampToTime(value)
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


export { AttributeField, TagsField, StatusField, TimestampField, PathField }

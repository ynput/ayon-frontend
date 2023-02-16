// Various components for formatting fields in the UI
import styled from 'styled-components'
import { useSelector } from 'react-redux'

// Attributes

const AttributeField = ({ value }) => {
  return <>{value}</>
}

// Tags

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`

const TagsField = ({ value }) => {
  const tags = useSelector((state) => state.project.tags)
  if (!value?.length) return '-'

  return (
    <TagsContainer>
      {value.map((tag) => (
        <span key={tag} style={{ color: tags[tag]?.color }}>
          {tag}
        </span>
      ))}
    </TagsContainer>
  )
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

const isoToTime = (isoTime) => {
  if (!isoTime) return ['-', '-']
  const date = new Date(isoTime)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return [`${year}-${month}-${day}`, `${hours}:${minutes}:${seconds}`]
}

const TimestampField = ({ value }) => {
  const [dd, tt] = isoToTime(value)
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
  return <PathContainer>{value}</PathContainer>
}

export { AttributeField, TagsField, TimestampField, PathField }

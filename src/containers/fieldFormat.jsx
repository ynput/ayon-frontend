// Various components for formatting fields in the UI
import styled from 'styled-components'
import { useSelector } from 'react-redux'
import { OverflowField, getReadableColor } from '@ynput/ayon-react-components'
import { copyToClipboard, formatDate, formatTime } from '@shared/util'

// Attributes

const AttributeField = ({ value }) => {
  return <>{value}</>
}

// Tags

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--base-gap-large);
`

const TagsField = ({ value }) => {
  const tags = useSelector((state) => state.project.tags)

  let isMulti = false
  // check if value is an array of arrays
  if (value[0] && Array.isArray(value[0])) {
    if (value.length > 1) isMulti = true
    // flatten the array with unique values
    value = [...new Set(value.flat())]
    if (isMulti) {
      // more than 5, splice to 5 and add '+x more'
      if (value.length > 4) {
        value[4] = `+${value.length - 4}`
        value = value.slice(0, 5)
      }
    }
  }

  if (!value?.length) return '-'

  return (
    <TagsContainer>
      {isMulti && <span>{'Mixed ('}</span>}
      {value.map(
        (tag) =>
          typeof tag === 'string' && (
            <span key={tag} style={{ color: getReadableColor(tags[tag]) }}>
              {tag}
            </span>
          ),
      )}
      {isMulti && <span>{')'}</span>}
    </TagsContainer>
  )
}

// Datetime

const DateTimeContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: var(--base-gap-large);
  align-items: center;
  > span:first-child {
    color: var(--md-sys-color-on-surface-variant);
  }
`

const TimestampField = ({ value, ddOnly }) => {
  if (!value) return ''
  return (
    <DateTimeContainer>
      <span>{formatDate(value)}</span>
      {!ddOnly && <span>{formatTime(value, { seconds: true })}</span>}
    </DateTimeContainer>
  )
}

const PathField = ({ value }) => {
  if (!value) return '\u00A0'
  return <OverflowField value={value} onClick={copyToClipboard} />
}

export { AttributeField, TagsField, TimestampField, PathField }

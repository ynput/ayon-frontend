// Various components for formatting fields in the UI
import styled from 'styled-components'
import { useSelector } from 'react-redux'
import { OverflowField, getReadableColor } from '@ynput/ayon-react-components'
import { copyToClipboard, formatDate, formatDateTime } from '@shared/util'

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

// seconds by default: this field shows event and session logs
const TimestampField = ({ value, ddOnly, seconds = true }) => {
  if (!value) return ''
  return <span>{ddOnly ? formatDate(value) : formatDateTime(value, { seconds })}</span>
}

const PathField = ({ value }) => {
  if (!value) return '\u00A0'
  return <OverflowField value={value} onClick={copyToClipboard} />
}

export { AttributeField, TagsField, TimestampField, PathField }

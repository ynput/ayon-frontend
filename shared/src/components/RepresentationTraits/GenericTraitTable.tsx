import { FC, useState } from 'react'
import * as Styled from './RepresentationTraits.styled'
import { isPlainObject } from './utils/traitModel'
import { formatScalar, isScalar, LONG_TEXT_LENGTH } from './utils/schemaFields'

// objects with more keys start collapsed (e.g. template data)
const COLLAPSE_KEYS = 8
const MAX_DEPTH = 6

/** Text shortened to its start until expanded, e.g. lists stored as one string by older code. */
export const LongText: FC<{ text: string }> = ({ text }) => {
  const [expanded, setExpanded] = useState(false)
  if (text.length <= LONG_TEXT_LENGTH) return <>{text}</>

  return (
    <>
      {expanded ? text : `${text.slice(0, LONG_TEXT_LENGTH)}…`}{' '}
      <Styled.TextToggle type="button" onClick={() => setExpanded((value) => !value)}>
        {expanded ? 'Show less' : `Show all ${text.length} characters`}
      </Styled.TextToggle>
    </>
  )
}

interface GenericValueProps {
  value: unknown
  depth?: number
}

/** Shows any stored value as it is, without a definition. */
export const GenericValue: FC<GenericValueProps> = ({ value, depth = 0 }) => {
  if (value === null || value === undefined) return <Styled.Empty>Not set</Styled.Empty>
  if (value === '') return <Styled.Empty>Empty</Styled.Empty>
  if (typeof value === 'string') return <LongText text={value} />
  if (isScalar(value)) return <>{formatScalar(value)}</>
  if (depth >= MAX_DEPTH) return <Styled.Code>{JSON.stringify(value)}</Styled.Code>

  if (Array.isArray(value)) {
    if (!value.length) return <Styled.Empty>Empty</Styled.Empty>
    if (value.every(isScalar)) {
      return (
        <Styled.InlineList>
          {value.map((item, index) => (
            <Styled.Tag key={index}>{formatScalar(item)}</Styled.Tag>
          ))}
        </Styled.InlineList>
      )
    }
    return (
      <Styled.List>
        {value.map((item, index) => (
          <li key={index}>
            <GenericValue value={item} depth={depth + 1} />
          </li>
        ))}
      </Styled.List>
    )
  }

  if (!isPlainObject(value)) return <>{String(value)}</>

  const entries = Object.entries(value)
  if (!entries.length) return <Styled.Empty>Empty</Styled.Empty>

  const table = (
    <Styled.FieldTable>
      <tbody>
        {entries.map(([key, item]) => (
          <tr key={key}>
            <td className="label">{key}</td>
            <td className="value">
              <GenericValue value={item} depth={depth + 1} />
            </td>
          </tr>
        ))}
      </tbody>
    </Styled.FieldTable>
  )

  if (depth === 0 || entries.length <= COLLAPSE_KEYS) return table
  return (
    <Styled.Details>
      <summary>{entries.length} keys</summary>
      {table}
    </Styled.Details>
  )
}

interface GenericTraitTableProps {
  value: unknown
}

/** Raw view of a trait without a definition. */
export const GenericTraitTable: FC<GenericTraitTableProps> = ({ value }) => {
  if (isPlainObject(value) && !Object.keys(value).length) {
    return <Styled.Empty>No values</Styled.Empty>
  }
  return <GenericValue value={value} />
}

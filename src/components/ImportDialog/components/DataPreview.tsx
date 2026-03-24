import { Panel } from "@ynput/ayon-react-components"
import { ImportData } from "../utils"
import styled from "styled-components"
import { CSSProperties, useMemo } from "react"
import clsx from "clsx"
import { countBy } from "lodash"

type Props = {
  data: ImportData
  column: string | null
  unique: boolean
}

const List = styled.ol`
  --max-row-index-length: 2;

  background: var(--md-sys-color-surface-container-low);
  list-style-type: none;
  padding: 0;
  margin: 0;
  counter-reset: import-data-preview-row;
`
const Item = styled.li`
  padding: var(--padding-m);
  counter-increment: import-data-preview-row;
  display: flex;
  gap: var(--base-gap-medium);

  span {
    text-overflow: ellipsis;
    overflow: hidden;
    flex-shrink: 1;
  }

  &::before {
    content: counters(import-data-preview-row, ".", decimal);
    color: var(--md-sys-color-outline);
    width: calc(var(--max-row-index-length) * 1ch);
    display: inline-block;
  }

  .unique &::before {
    content: none;
  }

  & + & {
    border-top: 1px solid var(--md-sys-color-surface-container);
  }
`

const EmptyValue = styled.span`
  color: var(--md-sys-color-outline);
`

const PlaceholderPanel = styled(Panel)`
  height: 100%;
  color: var(--md-sys-color-outline);
  text-align: center;
  padding-top: var(--padding-l);
`

const ItemOccurrences = styled.span`
  color: var(--md-sys-color-outline);
  margin-left: auto;
  margin-right: 0;
`

const printValue = (value: any) => {
  if (["boolean", "number"].includes(typeof value)) return value.toString()
  if (["undefined", "null"].includes(value)) return null
  return value
}

function Placeholder() {
  return <PlaceholderPanel>Click the columns to the left to preview their values.</PlaceholderPanel>
}

export default function DataPreview({ data, column, unique }: Props) {
  if (!column) return <Placeholder />

  const maxRowIndexLength = useMemo(
    () => data.rows.length.toString().length,
    [data.rows]
  )

  const histogram = useMemo(
    () => {
      // ensure `undefined` is coerced to `null`
      const processedRows = data.rows.map((row) => row[column] ? row : { ...row, [column]: null })
      return Object.entries(countBy(processedRows, column))
        .toSorted(([, c1], [, c2]) => c2 - c1)
    },
    [data.rows, column],
  )

  return (
    <List
      className={clsx({ unique })}
      style={{ '--max-row-index-length': maxRowIndexLength } as unknown as CSSProperties}
    >
      {
        !unique && data.rows.map((row, index) => (
          <Item key={index}>
            {printValue(row[column]) || <EmptyValue>-</EmptyValue>}
          </Item>
        ))
      }
      {
        unique && histogram.map(([value, count], index) => (
          <Item key={index}>
            {printValue(value) || <EmptyValue>(empty)</EmptyValue>}
            <ItemOccurrences>
              {count}
            </ItemOccurrences>
          </Item>
        ))
      }
    </List>
  )
}

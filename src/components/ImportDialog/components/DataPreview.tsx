import { Panel } from "@ynput/ayon-react-components"
import { ImportData } from "../utils"
import styled from "styled-components"
import { CSSProperties, useMemo } from "react"

type Props = {
  data: ImportData
  column: string | null
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

const printValue = (value: any) => {
  if (["boolean", "number"].includes(typeof value)) return value.toString()
  return value
}

function Placeholder() {
  return <PlaceholderPanel>Click the columns to the left to preview their values.</PlaceholderPanel>
}

export default function DataPreview({ data, column }: Props) {
  if (!column) return <Placeholder />

  const maxRowIndexLength = useMemo(
    () => data.rows.length.toString().length,
    [data.rows]
  )

  return (
    <List style={{ '--max-row-index-length': maxRowIndexLength } as unknown as CSSProperties}>
      {
        data.rows.map((row, index) => (
          <Item key={index}>
            {printValue(row[column]) || <EmptyValue>-</EmptyValue>}
          </Item>
        ))
      }
    </List>
  )
}

import { Panel } from "@ynput/ayon-react-components"
import { ImportData } from "../utils"
import styled from "styled-components"

type Props = {
  data: ImportData
  column: string | null
}

const List = styled.ol`
  background: var(--md-sys-color-surface-container-low);
  list-style-type: none;
  padding: 0;
  margin: 0;
`
const Item = styled.li`
  padding: var(--padding-m);

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

  return (
    <List>
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

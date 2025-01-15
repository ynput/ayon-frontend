import { $Any } from '@types'
import { FC, useState } from 'react'
import styled from 'styled-components'

export const SpanCell = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 150px;
  height: 100%;
  user-select: none;
  padding: 8px;

  cursor: pointer;


  &.selected {
    background-color: var(--md-sys-color-primary-container);
  }
`

type Props = {
  value: string
  updateHandler: Function
}

const SimpleEditableCell: FC<HTMLElement & Props> = ({ value, updateHandler }) => {
  const [val, setVal] = useState(value)
  const [editable, setEditable] = useState(false)

  const blurHandler = (e: $Any) => {
    setEditable(false)
  }

  const clickHandler = (e: $Any) => {
    setEditable(true)
  }
  const keyDownHandler = (e: $Any) => {
    if (e.key == 'Enter') {
      updateHandler(e.target.value)
      setEditable(false)
    }
    if (e.key == 'Escape') {
      updateHandler(value)
      setEditable(false)
    }
  }

  return editable ? (
    <input defaultValue={value} onBlur={blurHandler} onKeyDown={keyDownHandler} />
  ) : (
    <SpanCell
      suppressContentEditableWarning={true}
      contentEditable={editable}
      onKeyDown={keyDownHandler}
      onDoubleClick={clickHandler}
    >
      {value}
    </SpanCell>
  )
}

export default SimpleEditableCell

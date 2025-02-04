import { $Any } from '@types'
import { FC, useEffect, useRef, useState } from 'react'
import styled from 'styled-components'

export const SpanCell = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 160px;
  height: 100%;
  user-select: none;
  padding: 8px;

  cursor: pointer;


  &.selected {
    background-color: var(--md-sys-color-primary-container);
  }
`
const StyledInput = styled.input`
  width: 100%;
  height: 100%;
  display: block;
`

type Props = {
  value: string
  updateHandler: Function
}

const SimpleEditableCell: FC<HTMLElement & Props> = ({ value, updateHandler }) => {
  const [editable, setEditable] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editable) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }

  }, [editable])
  const blurHandler = (e: $Any) => {
    updateHandler(e.target.value)
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
    <StyledInput ref={inputRef} defaultValue={value} onBlur={blurHandler} onKeyDown={keyDownHandler} />
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

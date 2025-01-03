import { FC } from 'react'
import styled from 'styled-components'

export const SpanCell = styled.div`
  width: 150px;
  user-select: none;
  padding: 0px 4px;

  display: flex;
  gap: var(--base-gap-small);
  align-items: center;
  cursor: pointer;

  border-radius: var(--border-radius-m);

  .title {
    width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .loading {
    pointer-events: none;
  }

  &:hover {
    background-color: var(--md-sys-color-surface-container-hover);
  }

  &.selected {
    background-color: var(--md-sys-color-primary-container);

    &,
    .icon {
      color: var(--md-sys-color-on-primary-container);
    }
  }
`

const SimpleEditableCell: FC<HTMLSpanElement & { value: string }> = ({ value }) => {
  return (
    <SpanCell suppressContentEditableWarning={true} contentEditable>
      {value}
    </SpanCell>
  )
}

export default SimpleEditableCell

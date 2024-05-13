import styled from 'styled-components'

export const MentionSelect = styled.ul`
  margin: 0;
  translate: 0 -100%;
  z-index: 1000;

  background-color: var(--md-sys-color-surface-container-high);
  padding: 0;

  position: absolute;

  top: -4px;
  right: 4px;
  left: 4px;
  border-radius: var(--border-radius-m);

  /* box shadow */
  box-shadow: 0 3px 15px 0 rgba(0, 0, 0, 0.4);
`
export const MentionItem = styled.li`
  /* reset defaults*/
  list-style: none;
  margin: 0;
  padding: 6px 8px;
  border-radius: var(--border-radius-m);

  display: flex;
  gap: var(--base-gap-large);
  align-items: center;
  user-select: none;
  cursor: pointer;

  &:hover,
  &.selected {
    background-color: var(--md-sys-color-surface-container-high-hover);
  }

  .image {
    /* if not circle make square */
    ${({ $isCircle }) => !$isCircle && `border-radius: var(--border-radius-m);`}
  }
`

export const MentionName = styled.span`
  font-weight: 500;
`

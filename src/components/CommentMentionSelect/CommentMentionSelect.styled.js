import styled, { css } from 'styled-components'

export const MentionSelect = styled.ul`
  margin: 0;
  translate: 0 -100%;

  background-color: var(--md-sys-color-surface-container-high);
  padding: 0;

  position: absolute;

  top: -4px;
  right: 0;
  left: 0;
  border-radius: var(--border-radius-m);

  /* box shadow */
  box-shadow: 0 3px 15px 0 rgba(0, 0, 0, 0.4);

  /* before any hover first item selected */
  ${({ $hasHovered }) =>
    !$hasHovered &&
    css`
      & > *:first-child {
        background-color: var(--md-sys-color-surface-container-high-hover);
      }
    `}
`
export const MentionItem = styled.li`
  /* reset defaults*/
  list-style: none;
  margin: 0;
  padding: 6px 8px;
  border-radius: var(--border-radius-m);

  display: flex;
  gap: 8px;
  align-items: center;
  user-select: none;
  cursor: pointer;

  &:hover {
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

import styled from 'styled-components'

export const Cell = styled.div`
  padding: 4px;
  flex: 1;
  box-shadow: 0px 0px 4px rgba(0, 0, 0, 0.2);
  cursor: pointer;

  &:hover {
    border-radius: 0;
    background-color: var(--md-sys-color-secondary-container);
    box-shadow: inset 0px 0px 0px 2px var(--md-sys-color-outline);
  }

  &.selected {
    border-radius: 0;
    background-color: var(--md-sys-color-primary-container);
    box-shadow: inset 0px 0px 0px 0.5px var(--md-sys-color-primary-container),
      inset 0px 0px 0px 1px var(--md-sys-color-primary);
  }

  &.active {
    box-shadow: inset 0px 0px 0px 0.5px var(--md-sys-color-primary-container),
      inset 0px 0px 0px 3px var(--md-sys-color-primary);
  }

  /* adjust image icon on entity card */
  .entity-card {
    .no-image {
      top: 45%;
    }

    /* a collapsed card is one row: the title (also in the cell tooltip) would sit on top of the
       assignees, which shows when the task has no known status to cover it */
    &.collapsed .row-top {
      justify-content: flex-end;

      .tag.title {
        display: none;
      }
    }
  }
`

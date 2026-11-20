import styled, { css } from 'styled-components'
import { Button } from '@ynput/ayon-react-components'

// The status card (EntityCard variant="status") as a table cell: also the Task progress page's.
export const taskStatusCardStyles = css`
  .entity-card {
    .no-image {
      top: 45%;
    }

    /* the card picks the status label, short code or icon by measuring what sits next to it:
       a tight 20px avatar leaves room for the short code at the usual column widths */
    .row-bottom .tag.users {
      width: fit-content;
      min-width: 0;

      .user-image {
        width: 20px !important;
        min-height: 20px !important;
        max-height: 20px !important;
      }
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

export const Cell = styled.div`
  display: flex;
  align-items: stretch;
  gap: 4px;
  width: 100%;
  height: 100%;
  padding: 0 4px;
  overflow: hidden;
  user-select: none;
  /* the task type's colour, faint: the cards carry the status colour */
  background-color: color-mix(in srgb, var(--task-type-color, transparent) 7%, transparent);

  &:focus-visible {
    outline: none;
  }

  /* a tall row: the cards stand clear of the row lines */
  &.expanded {
    padding: 3px 4px;
  }

  ${taskStatusCardStyles}

  /* the collapsed card is 34px high by itself; here it follows the row */
  .entity-card-wrapper,
  .entity-card {
    min-height: unset !important;
    height: 100%;
  }
`

// one task: the cards of a cell share its width
export const Card = styled.div`
  flex: 1 1 0;
  min-width: 0;
`

export const Loading = styled.div`
  flex: 1;
  border-radius: var(--border-radius-m);
`

// a folder without a task of the column's type
export const Empty = styled.div`
  flex: 1;
  border: 1px dashed var(--md-sys-color-outline-variant);
  border-radius: var(--border-radius-m);
  opacity: 0.6;
`

export const RowToggle = styled(Button)`
  &.row-expand-toggle {
    flex-shrink: 0;
    margin-right: 4px;
    padding: 2px;
    background-color: unset;
    color: var(--md-sys-color-outline);

    &:hover {
      background-color: var(--md-sys-color-surface-container-high-hover);
      color: var(--md-sys-color-on-surface);
    }

    &.expanded {
      color: var(--md-sys-color-primary);
    }
  }
`

export const HeaderIcon = styled.span`
  display: inline-flex;
  flex-shrink: 0;
`

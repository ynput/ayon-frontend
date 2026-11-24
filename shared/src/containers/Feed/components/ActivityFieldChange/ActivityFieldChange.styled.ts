import styled from 'styled-components'

export const FieldChange = styled.li`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  gap: var(--base-gap-small);
  width: 100%;
  padding: 4px 8px;
  border-radius: var(--border-radius-m);
  user-select: none;
`

export const Body = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  flex: 1;
  gap: var(--base-gap-small);
  padding: 0px 4px;
  .icon {
    font-variation-settings: 'FILL' 1;
    font-size: 16px;
  }
  [icon='trending_flat'] {
    color: var(--md-sys-color-outline);
    opacity: 0.5;
  }

  /* a status change is one line of the feed's history: the size of the text around it, a small
     square and a muted name, so it doesn't compete with comments */
  .status-change {
    font-size: 12px;
    color: var(--md-sys-color-on-surface-variant);

    .status {
      gap: 4px;
    }
    .status > :first-child {
      width: 14px;
      height: 14px;
      border-radius: 3px;
    }
    .status > :first-child .icon {
      font-size: 11px;
    }
    .arrow {
      font-size: 14px;
    }
  }
`

export const Text = styled.span`
  color: var(--md-sys-color-outline);
  white-space: nowrap;
  font-size: 12px;
  strong {
    font-size: 12px;
    font-weight: 800;
  }
`

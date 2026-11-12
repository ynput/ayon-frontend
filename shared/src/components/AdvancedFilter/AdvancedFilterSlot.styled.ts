import styled from 'styled-components'

// same height as the search bar it sits next to
export const Chip = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
  height: 32px;
  padding: 0 2px 0 8px;
  flex-shrink: 0;
  white-space: nowrap;
  user-select: none;

  border-radius: var(--border-radius-m);
  background-color: var(--md-sys-color-surface-container-high);

  .count {
    min-width: 18px;
    padding: 0 4px;
    text-align: center;
    border-radius: 9px;
    background-color: var(--md-sys-color-primary-container);
    color: var(--md-sys-color-on-primary-container);
  }

  .remove {
    padding: 4px;
  }
`

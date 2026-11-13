import styled from 'styled-components'
import { Button } from '@ynput/ayon-react-components'

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
  color: var(--md-sys-color-on-surface);
  background-color: var(--md-sys-color-surface-container-high);

  /* the same badge as on the editor's button */
  .count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    border-radius: 9px;
    font-size: 11px;
    font-weight: 600;
    line-height: 1;
    background-color: var(--md-sys-color-primary);
    color: var(--md-sys-color-on-primary);
  }

  .remove {
    padding: 4px;
  }
`

// the last item inside the search bar, at its right end whatever the bar holds (React may
// append its own children after it)
export const MoveButton = styled(Button)`
  order: 1;
  margin-left: auto;
  flex-shrink: 0;
  padding: 2px 6px;
  white-space: nowrap;
`

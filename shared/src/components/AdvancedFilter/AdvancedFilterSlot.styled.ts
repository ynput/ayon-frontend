import styled from 'styled-components'
import { Button } from '@ynput/ayon-react-components'

// no box of its own: its chip is one of the search bar's, at the end before the filter button
export const SlotContent = styled.span`
  display: contents;

  & > * {
    order: 1;
    flex-shrink: 0;
  }
`

// the size of the search bar's chips
export const Chip = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  height: 24px;
  padding: 0 2px 0 6px;
  flex-shrink: 0;
  white-space: nowrap;
  user-select: none;

  border-radius: 4px;
  color: var(--md-sys-color-on-surface);
  background-color: var(--md-sys-color-surface-container-high);

  .icon {
    font-size: 16px;
  }

  /* the same badge as on the editor's chip */
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
    padding: 1px;
  }
`

// the last item inside the search bar, at its right end whatever the bar holds
export const BarButton = styled(Button)`
  order: 2;
  margin-left: auto;
  flex-shrink: 0;
  gap: 0;
  padding: 2px 4px;

  .bolt {
    font-size: 14px;
  }
`

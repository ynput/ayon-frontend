import styled from 'styled-components'
import { Button, Panel } from '@ynput/ayon-react-components'

export const StatsWrapper = styled.div`
  flex-grow: 1;
  align-content: center;
  justify-content: center;
`

export const StatsPanel = styled(Panel)`
  background: var(--md-sys-color-surface-container-high);
  margin: 0 auto;
  max-width: max-content;
`
export const Stat = styled(Panel)`
  background: var(--md-sys-color-surface-container-low);
  padding: var(--padding-s);

  &.danger {
    background: var(--md-sys-color-error-container);
    color: var(--md-sys-color-on-error-container);
  }
`
export const StatsHeading = styled.h2`
  margin: 0;
  font-size: inherit;
  display: flex;
  gap: var(--base-gap-small);
  align-items: center;
  min-width: 300px;
`
export const StatsSubtitle = styled.div`
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
`
export const StatsFileSize = styled.span`
  color: var(--md-sys-color-outline);
  margin-left: 1ch;
`
export const StatsRemove = styled(Button)`
  margin-left: auto;
  margin-right: 0;
`

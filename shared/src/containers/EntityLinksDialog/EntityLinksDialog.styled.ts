import styled from 'styled-components'
import { theme } from '@ynput/ayon-react-components'

export const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-large);
  min-height: 360px;
  max-height: 70vh;
`

export const Header = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-large);

  .thumbnail {
    width: 96px;
    min-width: 96px;
    height: 54px;
  }

  .titles {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    flex: 1;
  }

  .name {
    ${theme.titleMedium}
    display: flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .sub {
    ${theme.bodySmall}
    color: var(--md-sys-color-outline);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`

export const Breadcrumbs = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
  flex-wrap: wrap;
  ${theme.bodySmall}
  color: var(--md-sys-color-outline);

  button {
    border: none;
    background: none;
    color: var(--md-sys-color-primary);
    cursor: pointer;
    padding: 2px 4px;
    border-radius: 4px;
    font: inherit;

    &:hover {
      background-color: var(--md-sys-color-surface-container-high-hover);
    }
  }
`

export const Columns = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--base-gap-large);
  overflow: hidden;
  flex: 1;
  min-height: 0;

  @media (max-width: 800px) {
    grid-template-columns: 1fr;
    overflow-y: auto;
  }
`

export const Column = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-medium);
  min-height: 0;
  overflow-y: auto;
  padding: var(--padding-m, 8px);
  border-radius: var(--border-radius-l);
  background-color: var(--md-sys-color-surface-container-low);
`

export const ColumnHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  ${theme.titleSmall}
  padding: 2px 4px;

  .count {
    color: var(--md-sys-color-outline);
    font-weight: normal;
  }
  .hint {
    ${theme.bodySmall}
    color: var(--md-sys-color-outline);
    font-weight: normal;
    margin-left: auto;
  }
`

export const Group = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;

  &.empty {
    opacity: 0.6;
  }
`

export const GroupHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 4px;
  ${theme.labelLarge}

  .dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .pair {
    ${theme.bodySmall}
    color: var(--md-sys-color-outline);
  }
  .grow {
    flex: 1;
  }
  button {
    padding: 2px 6px;
  }
`

export const Empty = styled.div`
  ${theme.bodyMedium}
  color: var(--md-sys-color-outline);
  padding: 4px 8px;
`

export const Footer = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-medium);
  width: 100%;

  .grow {
    flex: 1;
  }
  .note {
    ${theme.bodySmall}
    color: var(--md-sys-color-outline);
    display: flex;
    align-items: center;
    gap: 6px;
  }
`

export const StudioChip = styled.span`
  padding: 1px 6px;
  border-radius: 4px;
  ${theme.labelSmall}
  color: var(--color-sub-studio, var(--md-sys-color-tertiary));
  border: 1px solid var(--color-sub-studio, var(--md-sys-color-tertiary));
`

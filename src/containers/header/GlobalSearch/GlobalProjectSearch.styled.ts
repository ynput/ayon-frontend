import { InputText } from '@ynput/ayon-react-components'
import styled from 'styled-components'

export const Container = styled.div`
  position: relative;
  width: 100%;
  min-width: 0;
  z-index: 1400;
`

export const SearchField = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;

  .search-icon {
    position: absolute;
    left: 10px;
    color: var(--md-sys-color-on-surface-variant);
    pointer-events: none;
    z-index: 1;
  }
`

export const SearchInput = styled(InputText)`
  width: 100%;
  padding-left: 34px;
  background-color: var(--md-sys-color-surface-container-highest);
  border-radius: var(--border-radius-m) 0 0 var(--border-radius-m);
`

export const Dropdown = styled.div`
  position: absolute;
  top: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  width: max(100%, min(520px, calc(100vw - 32px)));
  max-width: calc(100vw - 32px);
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px;
  background-color: var(--md-sys-color-surface-container-low);
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: var(--border-radius-m);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
  max-height: min(420px, calc(100vh - 120px));
  overflow-y: auto;
  z-index: 1402;
`

export const ResultButton = styled.button`
  width: 100%;
  border: none;
  background: transparent;
  color: inherit;
  display: grid;
  grid-template-columns: 28px 1fr;
  gap: 10px;
  align-items: center;
  padding: 8px 10px;
  border-radius: var(--border-radius-m);
  text-align: left;
  cursor: pointer;
  transition: background-color 0.15s ease;

  .result-icon {
    color: var(--md-sys-color-on-surface-variant);
  }

  &:hover,
  &.highlighted {
    background-color: var(--md-sys-color-surface-container-highest);
  }
`

export const ResultMedia = styled.span`
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  .result-icon {
    color: var(--md-sys-color-on-surface-variant);
    font-size: 18px;
    line-height: 1;
  }
`

export const ResultThumbnail = styled.img`
  width: 100%;
  height: 100%;
  display: block;
  border-radius: var(--border-radius-s);
  object-fit: cover;
  background-color: var(--md-sys-color-surface-container-highest);
`

export const ResultBody = styled.span`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
`

export const PrimaryText = styled.span`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--md-sys-color-on-surface);
`

export const SecondaryText = styled.span`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--md-sys-color-on-surface-variant);
  font-size: 0.85rem;
`

export const StatusRow = styled.div`
  padding: 10px 12px;
  color: var(--md-sys-color-on-surface-variant);
  font-size: 0.9rem;
`

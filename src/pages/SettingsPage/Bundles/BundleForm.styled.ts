import styled, { css } from 'styled-components'
import { Splitter } from 'primereact/splitter'
import { theme } from '@ynput/ayon-react-components'

export const FormSplitter = styled(Splitter)`
  flex: 1;
  min-height: 0;
  width: 100%;
  overflow: hidden;
`

// same panel surface as the lists and overview pages
const panelSurface = css`
  background-color: var(--md-sys-color-surface-container-low);
  border-radius: var(--border-radius-m);
  padding: var(--padding-m);
`

export const AddonsPanel = styled.div`
  ${panelSurface}
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-small);
  height: 100%;
  min-width: 0;
  overflow: hidden;
`

export const AddonsHeader = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--base-gap-small);
  min-height: 32px;

  & > input {
    flex: 1;
    min-width: 160px;
    max-width: 240px;
    margin-left: auto;
  }
`

export const AddonsTitle = styled.span`
  display: flex;
  align-items: center;
  ${theme.labelLarge}
  height: 32px;
  padding-left: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

export const AddonsList = styled.div`
  flex: 1;
  min-height: 0;
`

// same stack as the entity details panel
export const DetailsCards = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  overflow-y: auto;
  ${panelSurface}

  & > * {
    flex: none;
  }
`

// grid of the details panel attribute rows
export const FieldRow = styled.div`
  display: grid;
  grid-template-columns: minmax(120px, 1fr) minmax(0, 2fr);
  column-gap: 4px;
  align-items: center;
  min-height: 32px;

  .field {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
    min-width: 0;
  }
`

export const FieldGrow = styled.div`
  flex: 1;
  min-width: 0;

  & > * {
    width: 100%;
  }
`

export const FieldText = styled.span`
  color: var(--md-sys-color-on-surface);
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

export const BundleNameInput = styled.div<{ $hasError?: boolean }>`
  flex: 1;
  input {
    width: 100%;
  }

  input {
    ${({ $hasError }) =>
      $hasError &&
      `
      outline: 1px solid var(--color-hl-error);
    `}
  }
`

export const SearchHintText = styled.span`
  grid-column: 1 / -1;
  font-size: 12px;
  color: var(--md-sys-color-outline);
  height: 16px;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  margin-left: 3px;
`

export const SearchHintLink = styled.a`
  cursor: pointer;
  text-decoration: underline;
  color: inherit;
`

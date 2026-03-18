import { Dropdown } from "@ynput/ayon-react-components"
import styled from "styled-components"

// what are you doing, step-container?
export const StepContainer = styled.div`
  display: flex;
  flex-flow: column;
  height: 100%;
  overflow: hidden;
`

export const Container = styled.div`
  display: grid;
  grid-template-columns: minmax(66%, max-content) 1fr;
  gap:var(--base-gap-medium);
  height: 100%;
  overflow: hidden;
`
export const MappersContainer = styled.div`
  height: 100%;
  overflow-y: auto;
  position: relative;
`
export const Mappers = styled.table`
  border-collapse: collapse;
  width: 100%;
`
export const MappersTableHeader = styled.thead`
  background: var(--md-sys-color-surface-container);
  position: sticky;
  top: 0;
  z-index: 100;
`
export const MappersTableHeaderCell = styled.th`
  padding: var(--padding-m) var(--padding-l);
  font-weight: bold;
  text-align: left;
`
export const MappersTableBody = styled.tbody`
  background: var(--md-sys-color-surface-container-low);
`
export const MappersTableBodyRow = styled.tr`
  cursor: pointer;
  &:hover {
    background: rgb(from var(--md-sys-color-surface-container-low-hover) r g b);
  }

  &.selected {
    background: var(--md-sys-color-surface-container-high);
  }
`
export const MappersTableBodyCell = styled.td`
  border-bottom: solid 1px var(--md-sys-color-surface);
  padding: var(--padding-m) var(--padding-l);
  align-items: center;

  & > * {
    vertical-align: middle;
  }
`

export const MappersTableColumnName = styled.th`
  padding: var(--padding-m) var(--padding-l);
  position: relative;
  text-align: left;

  &::before {
    content: "";
    border-left: solid 3px;
    height: 100%;
    position: absolute;
    left: 0;
    top: 0;
  }

  &.unresolved::before {
    border-left-color: var(--md-sys-color-primary);
  }
  &.resolved::before {
    border-left-color: var(--md-sys-color-tertiary);
  }
  &.error::before {
    border-left-color: var(--md-sys-color-error-container);
  }
`

export const MappersTableAttribute = styled(MappersTableBodyCell)`
  padding-right: var(--padding-s);
`
export const MappersTableErrorHandling = styled(MappersTableBodyCell)`
  padding-left: var(--padding-s);
  padding-right: var(--padding-s);
`

export const PickActionDropdown = styled(Dropdown)`
  background: none;
  width: 100%;

  button, button:hover {
    background: var(--md-sys-color-surface-container-highest);
    padding-top: var(--padding-s);
    padding-bottom: var(--padding-s);
  }

  button:hover {
    background: var(--md-sys-color-surface-container-highest-hover);
  }

  .template-value {
    border: none;
  }
`

export const Preview = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  position: relative;
`

export const PreviewHeading = styled.h2`
  background: var(--md-sys-color-surface-container);
  padding: var(--padding-m) var(--padding-m);
  margin: 0;
  font-size: inherit;
  position: sticky;
  top: 0;
  z-index: 1;
  line-height: 20px;
`

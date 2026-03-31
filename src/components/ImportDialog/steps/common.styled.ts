import { DefaultValueTemplate, Dropdown } from "@ynput/ayon-react-components";
import styled from "styled-components";

// what are you doing, step-container?
export const StepContainer = styled.div`
  display: flex;
  flex-flow: column;
  height: 100%;
  overflow: hidden;
  margin-top: var(--padding-l);
`

export const StepNavButtons = styled.div`
  display: flex;
  gap: var(--base-gap-small);
  justify-content: end;
  margin: var(--padding-l) 0 0;
  align-items: center;
`

export const StepNavStats = styled.span`
  margin-left: 0;
  margin-right: auto;
  color: var(--md-sys-color-outline);
  display: flex;
  gap: var(--base-gap-small);
`

export const StepNavStatsRequired = styled.span`
  margin-left: 1ch;
  color: var(--md-sys-color-warning);
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
`

export const MappersContainer = styled.div`
  height: 100%;
  overflow-y: auto;
  position: relative;
`
export const Mappers = styled.table`
  border-collapse: collapse;
  width: 100%;
  user-select: none;
`
export const MappersTableHeader = styled.thead`
  background: var(--md-sys-color-surface-container);
  position: sticky;
  top: 0;
  z-index: 100;
`
export const MappersTableHeaderCell = styled.th`
  padding: 0 var(--padding-l) var(--padding-m);
  line-height: 32px;
  font-weight: bold;
  text-align: left;
  white-space: nowrap;
`
export const MappersTableHeaderErrorHandling = styled(MappersTableHeaderCell)`
  padding-left: var(--padding-s);
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

  input {
    width: 100%;
  }
`

export const MappersTableColumnName = styled.th`
  border-bottom: solid 1px var(--md-sys-color-surface);
  padding: var(--padding-m) var(--padding-l);
  position: relative;
  text-align: left;

  &::before {
    content: "";
    border-bottom: inherit;
    height: 100%;
    width: 3px;
    position: absolute;
    left: 0;
    top: 0;
  }

  &.unresolved::before, &.error::before {
    background-color: var(--md-sys-color-error);
  }
  &.resolved::before {
    background-color: var(--md-sys-color-primary);
  }
  &.autoresolved::before {
    background-color: var(--md-sys-color-tertiary);
  }

  &.empty {
    color: var(--md-sys-color-outline);
  }
`

export const MappingError = styled.span`
  display: inline-flex;
  vertical-align: middle;
  margin-left: 1ch;
  align-items: center;
  gap: var(--base-gap-small);

  &, & .icon {
    color: var(--md-sys-color-error);
  }
`

export const MappersTableAttribute = styled(MappersTableBodyCell)`
  padding-right: var(--padding-s);
`
export const MappersTableErrorHandling = styled(MappersTableBodyCell)`
  padding-left: var(--padding-s);
  padding-right: var(--padding-s);
`

export const MappersTableActionCol = styled.col`
  width: calc(var(--padding-l) * 2 + 14ch);
`
export const MappersTableErrorHandlingCol = styled.col`
  width: max-content;
`

export const MapperDropdown = styled(Dropdown)`
  width: 100%;
`

export const PickActionDropdown = styled(MapperDropdown)`
  background: none;
  height: auto;

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

export const DropdownValueLabel = styled.span`
  display: inline-flex;
  gap: var(--base-gap-small);
  width: 100%;

  span:has(> &) {
    width: 100%;
    display: flex;
  }

  div:has(> span > &) {
    width: 100%;
  }
`

export const TargetType = styled.span`
  color: var(--md-sys-color-outline);
  margin-left: auto;
  font-size: var(--md-sys-typescale-body-small-font-size);
  padding-right: var(--padding-s);
`

export const SwitchWrapper = styled.label`
  display: flex;
  gap: 1ch;
  align-items: center;
`

export const DropdownValueTemplate = styled(DefaultValueTemplate)`
  .icon:first-child {
    color: var(--icon-color);
  }
`

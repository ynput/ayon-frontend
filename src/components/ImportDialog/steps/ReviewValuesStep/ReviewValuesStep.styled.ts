import { Button } from "@ynput/ayon-react-components";
import styled from "styled-components";
import { MappersContainer } from "../common.styled";

export const Container = styled.div`
  display: flex;
  gap: var(--base-gap-small);
  flex-grow: 1;
  overflow: hidden;
`

export const ColumnsListWrapper = styled.div`
  flex-basis: 25ch;
  display: flex;
  flex-flow: column;
`

export const ColumnsListScrollable = styled.div`
  overflow-x: hidden;
  overflow-y: auto;
`

export const Heading = styled.h2`
  font-size: inherit;
  margin: 0 0 var(--padding-m);
  line-height: 32px;
`

export const ColumnsList = styled.ul`
  background: var(--md-sys-color-surface-container-low);
  border-radius: var(--border-radius-m);
  list-style-type: none;
  padding: var(--padding-s);
  margin: 0;
  display: flex;
  flex-flow: column nowrap;
  gap: var(--base-gap-small);
  flex-grow: 1;
`

export const ColumnsListButton = styled(Button)`
  justify-content: start;
  width: 100%;
`

export const ValueMappersContainer = styled(MappersContainer)`
  flex-grow: 1;
`

export const ColumnsListItemStats = styled.span`
  color: var(--md-sys-color-outline);
  margin-left: auto;
  margin-right: 0;
`

export const SelectedCount = styled.span`
  color: var(--md-sys-color-outline);
  margin-left: 1ch;

  &[hidden] {
    display: inline-flex;
    opacity: 0;
  }
`

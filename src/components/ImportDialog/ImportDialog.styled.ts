import { Dialog } from "@ynput/ayon-react-components";
import styled from "styled-components";

export const DialogContainer = styled(Dialog)`
  max-height: none;
  height: calc(100vh - var(--padding-l) * 4);
  width: calc(100vw - var(--padding-l) * 4);

  div:has(> &) {
    z-index: 900;
  }
`

export const DialogHeading = styled.h1`
  margin: 0;
  line-height: 1;
  display: flex;
  gap: var(--base-gap-small);
  align-items: center;
`

export const ImportContextWrapper = styled.span`
  background: var(--md-sys-color-surface-container-low);
  padding: 0 var(--padding-s);
  border-radius: var(--border-radius-m);
  margin-left: auto;
  margin-right: 0;
  align-self: start;
`

export const TemplatesSelector = styled.div`
  display: none;

  &.shown {
    display: flex;
    margin-left: var(--padding-m);
  }
`

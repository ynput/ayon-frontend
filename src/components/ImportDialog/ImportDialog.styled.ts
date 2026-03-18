import { Dialog } from "@ynput/ayon-react-components";
import styled from "styled-components";

export const DialogContainer = styled(Dialog)`
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
`

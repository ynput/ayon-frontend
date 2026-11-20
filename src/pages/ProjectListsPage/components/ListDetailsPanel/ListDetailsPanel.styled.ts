import styled from 'styled-components'
import { Panel as ARCPanel, Button, theme } from '@ynput/ayon-react-components'

export const Panel = styled(ARCPanel)`
  gap: 0px;
  height: 100%;
  padding: 0px;
  box-shadow: -2px 0 6px #00000047;
  z-index: 300;
  overflow: scroll;

  /* the tab bar, under the titles, closed off by a line (the panel's own, not one in a tab) */
  & > .tabbed-panel > .tabbed-panel-head {
    padding: var(--base-gap-large) var(--padding-m) var(--padding-m);
    margin-bottom: var(--padding-s);
    border-bottom: 1px solid var(--md-sys-color-outline-variant);
  }
`

export const Scrollable = styled.div`
  overflow: auto;
  flex: 1;
`

export const Section = styled.div`
  &:has(> *) {
    padding: var(--padding-m);
    padding-bottom: 0;

    &.border {
      border-bottom: 1px solid var(--md-sys-color-outline-variant);
    }
  }

  /* labels in a fixed column with their values right next to them */
  .with-padding > div {
    grid-template-columns: 120px minmax(0, 1fr) 32px;
  }

  .field-value > div {
    text-align: left;
  }

  /* every value starts at the same x: the text inside the input boxes and the read-only values */
  .field-value {
    padding: 0 8px;
  }

  /* an enum value has its own inner padding */
  .field-value:has(> .enum) {
    padding-left: 3px;
  }

  /* the "-" of an empty read-only field */
  .field-value.readonly > div:not(:has(*)) {
    color: var(--md-sys-color-outline);
  }

  /* read-only details: wrap long values (dates) instead of cutting them; an id has no spaces,
     so it still ends in an ellipsis, with its full value on hover */
  .with-padding > div:not(.field-row) > :nth-child(2) {
    padding-left: 8px;
    white-space: normal;
  }

  /* the list id comes last and is muted (the value sets its colour inline) */
  .with-padding > div:not(.field-row):last-child > :nth-child(2) {
    color: var(--md-sys-color-outline) !important;
  }
`


export const Titles = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-bottom: var(--padding-m);

  .title {
    ${theme.titleMedium}
    margin: 0;
    width: 100%;
  }
  .type {
    display: flex;
    gap: 4px;
    width: 100%;
  }
`

export const CloseButton = styled(Button)`
  position: absolute;
  top: var(--padding-m);
  right: 2px;
`

import styled from 'styled-components'
import { Panel as ARCPanel, Button, theme } from '@ynput/ayon-react-components'

export const Panel = styled(ARCPanel)`
  gap: 0px;
  height: 100%;
  padding: 0px;
  box-shadow: -2px 0 6px #00000047;
  z-index: 300;
  overflow: scroll;
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

  /* the panel is the card: the attribute and detail groups inside are plain, with a title */
  > div {
    border: none;
    border-radius: 0;

    > :first-child:not(.with-padding) {
      min-height: 0;
      padding: 4px 0 8px;
      font-weight: 600;
    }

    > .with-padding {
      padding: 0;
    }
  }

  & + &:has(> *) {
    margin-top: var(--padding-m);
    border-top: 1px solid var(--md-sys-color-outline-variant);
  }

  /* labels in a fixed column with their values right next to them */
  .with-padding > div {
    grid-template-columns: 120px minmax(0, 1fr) 32px;
  }

  .field-value > div {
    text-align: left;
  }

  /* read-only details: wrap long values (dates) instead of cutting them; an id has no spaces,
     so it still ends in an ellipsis, with the copy button on hover */
  .with-padding > div:not(.field-row) > :nth-child(2) {
    padding-left: 4px;
    white-space: normal;
  }
`

export const Header = styled.div`
  display: flex;
  flex-direction: column;
  padding: var(--padding-m);
  margin-bottom: var(--padding-s);
  gap: var(--base-gap-large);

  border-bottom: 1px solid var(--md-sys-color-outline-variant);
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

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
      margin-top: 4px;
      padding: 4px 0 8px;

      span {
        font-weight: 600;
        color: var(--md-sys-color-on-surface);
      }
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

  /* every value starts at the same x: the text inside the input boxes and the read-only values */
  .field-value {
    padding: 0 8px;
  }

  /* an enum value has its own inner padding */
  .field-value:has(> .enum) {
    padding-left: 3px;
  }

  /* fields that can be edited in place look like inputs, so an empty one doesn't read as missing */
  .field-value:not(.readonly):not(:has(> input[type='checkbox'])) {
    background-color: var(--md-sys-color-surface-container-low);
    box-shadow: inset 0 0 0 1px var(--md-sys-color-outline-variant);

    &:hover {
      background-color: var(--md-sys-color-surface-container-low-hover);
    }

    &.editing {
      background-color: var(--md-sys-color-surface-container);
    }
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

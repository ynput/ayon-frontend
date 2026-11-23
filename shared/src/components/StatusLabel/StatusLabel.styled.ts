import styled from 'styled-components'

export const Status = styled.span`
  position: relative;
  display: inline-grid;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  vertical-align: middle;
  color: var(--md-sys-color-on-surface);

  /* the shown form sits on top of the hidden full one, which sets the width the label asks for */
  & > * {
    grid-area: 1 / 1;
  }
`

export const Form = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  white-space: nowrap;

  &.sizer {
    visibility: hidden;
  }

  /* measures a narrower form without taking part in the layout */
  &.measure {
    position: absolute;
    visibility: hidden;
  }

  .status {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
  }

  .label {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .arrow {
    flex-shrink: 0;
  }
`

// the status colour fills the square and the icon takes the text colour for it, as on the full pill
export const Square = styled.span`
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  border-radius: var(--border-radius-m);
  background-color: var(--md-sys-color-surface-container-high);

  .icon {
    font-size: 16px;
    color: inherit;
    font-variation-settings: 'FILL' 1;
  }
`

// the full names for screen readers, whichever form is shown
export const ScreenReaderText = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
`

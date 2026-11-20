import styled from 'styled-components'
import { LockedInput, Panel } from '@ynput/ayon-react-components'

export const PanelButtonsStyled = styled(Panel)`
  flex-direction: row;

  & > * {
    flex: 1;
  }
`

// edited in a dialog, but on the same surface as the fields edited in place, so it doesn't look disabled
export const EditableLockedInput = styled(LockedInput)`
  input {
    background-color: var(--md-sys-color-surface-container-low);

    &:hover {
      background-color: var(--md-sys-color-surface-container-low-hover);
    }
  }
`

// an ARC FormRow: a label and its field
const row = 'div:has(> .label + .field)'
// a card's panel: what follows its title
const panel = '.user-detail-title + *'

// The forms of the panel. With the flat settings layout they read like a flat settings sheet
// (SettingsEditor.sass): titles over panels of one-line rows, a soft line between two rows
export const FormsStyled = styled.section`
  flex: 1;
  overflow-x: clip;
  overflow-y: auto;
  gap: var(--base-gap-small);
  display: flex;
  flex-direction: column;

  &.flat {
    /* 32 from a panel to the next title's text, less the panel's and the title's own room */
    gap: 20px;
    padding: 4px 16px 16px;
    border-radius: var(--border-radius-m);
    background-color: var(--panel-background);

    /* a card has no box: its title sits on the sheet, over its panel */
    & > :has(> .user-detail-title) {
      gap: 2px;
      padding: 0;
      border-radius: 0;
      background-color: transparent;
    }

    .user-detail-title {
      display: flex;
      align-items: center;
      min-height: var(--base-input-size);
      padding: 0 12px;
      font-size: var(--md-sys-typescale-title-medium-font-size);
      font-weight: 600;
      color: var(--md-sys-color-on-surface);
    }

    /* panels are one step off the sheet, controls a step lighter again */
    ${panel},
    & > :not(:has(> .user-detail-title)) {
      border-radius: var(--border-radius-m);
      background-color: var(--md-sys-color-surface-container-lowest);
    }

    ${panel} {
      gap: 0;
      padding: 6px 0;
    }

    /* panels without a title (a service user, add-on sections) hold content of their own */
    & > :not(:has(> .user-detail-title)) {
      padding: 12px;
    }

    ${panel} > div:not(${row}) {
      gap: 0;
    }

    ${panel} :is(input[type='text'], input[type='password'], .dropdown > button) {
      background-color: var(--md-sys-color-surface-container);

      &:hover {
        background-color: var(--md-sys-color-surface-container-hover);
      }
    }

    /* custom attributes: rows are parted by lines already */
    ${panel} .user-attrib-divider {
      display: none;
    }

    ${panel} > span {
      margin: 6px 12px;
    }

    ${row} {
      position: relative;
      padding: 6px 12px;
    }

    /* a soft line between two rows, inset from both sides */
    ${row}::before {
      content: '';
      position: absolute;
      top: 0;
      left: 12px;
      right: 12px;
      border-top: 1px solid var(--md-sys-color-surface-container-high);
    }

    ${panel} > ${row}:first-child::before {
      content: none;
    }

    /* labels take the free room; text fields and dropdowns the row's second half */
    ${row} > .label {
      flex: 1 1 0;
      min-width: 0;
    }

    ${row} > .field {
      flex: 0 1 50%;
      min-width: 200px;
      gap: var(--base-gap-small);
    }

    /* a field grown under its control keeps its label on its first line */
    ${row}:has(> .field > :nth-child(2)) {
      align-items: flex-start;
    }

    /* a service's new API key, shown once under its field: one long word */
    ${row} > .field strong {
      overflow-wrap: anywhere;
    }

    /* switches, choice buttons and the invitation sit at the end of the row */
    ${row} > .field:has(.switch-body, .p-selectbutton, .invitation-row) {
      flex: none;
      min-width: 0;
      align-items: flex-end;
    }
  }
`

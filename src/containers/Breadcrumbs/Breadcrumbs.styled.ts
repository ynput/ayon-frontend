import styled from 'styled-components'
import { Button } from '@ynput/ayon-react-components'

// the room the pill has: what the header's left side leaves after its other items, whatever
// the pill shows
export const Slot = styled.div`
  flex: 1 1 0;
  min-width: 0;
  display: flex;
`

// the context pill: project, path to the selected entity and a copy button
export const Pill = styled.div`
  display: flex;
  align-items: center;
  min-width: 0;
  height: 32px;
  border-radius: var(--border-radius-m);
  overflow: hidden;
  background-color: var(--md-sys-color-surface-container-highest);
`

// the pill's buttons (go to a URI, copy it), beside it: they show while you point at the pill or
// tab to them, and keep their room meanwhile, so the path doesn't fold again when they show
export const Actions = styled.div`
  display: flex;
  flex-shrink: 0;
  height: 32px;
  border-radius: 0 var(--border-radius-m) var(--border-radius-m) 0;
  overflow: hidden;
  background-color: var(--md-sys-color-surface-container-highest);
  opacity: 0;
`

// the pill and its buttons
export const Group = styled.div`
  display: flex;
  align-items: center;
  min-width: 0;

  &:hover,
  &:has(:focus-visible) {
    ${Actions} {
      opacity: 1;
    }
    /* square where the buttons join it */
    ${Pill}:not(:last-child) {
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
    }
  }
`

// the project's thumbnail before its name (16:9, as on the Projects page): the pill's height but a
// thin rim, shown once loaded
export const Thumb = styled.img`
  width: 50px;
  height: 28px;
  flex-shrink: 0;
  object-fit: cover;
  /* in line with the pill's corners (4px) at the 2px rim */
  border-radius: 2px;

  &.loading {
    visibility: hidden;
  }
`

// the project name: opens the project switcher
export const ProjectButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  max-width: 240px;
  height: 100%;
  padding: 6px 6px 6px 10px;
  border: none;
  background: none;
  color: var(--md-sys-color-on-surface);
  cursor: pointer;
  white-space: nowrap;

  font-family: var(--md-sys-typescale-body-large-font-family-name);
  font-size: 14px;
  line-height: 20px;

  strong {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    font-weight: 700;
  }

  .icon {
    font-size: 18px;
  }

  &:hover,
  &.open {
    background-color: var(--md-sys-color-surface-container-highest-hover);
  }

  /* a thumbnail sits as far in as it is from the pill's top and bottom */
  &:has(img) {
    padding-left: 2px;
  }

  /* on Home: no project yet, an empty place in the path */
  &.choose {
    outline: 1px dashed var(--md-sys-color-outline);
    outline-offset: -1px;
    border-radius: var(--border-radius-m) 0 0 var(--border-radius-m);
  }
  /* alone in the pill: its corners */
  &.choose:last-child {
    border-radius: inherit;
  }
  &.choose strong {
    font-weight: 500;
    color: var(--md-sys-color-on-surface-variant);
  }
`

export const Display = styled.button`
  display: flex;
  align-items: center;
  gap: var(--base-gap-large);
  min-width: 0;
  height: 100%;
  padding: 6px 10px 6px 2px;
  border: none;
  background: none;
  color: var(--md-sys-color-on-surface);
  cursor: text;
  white-space: nowrap;

  font-family: var(--md-sys-typescale-body-large-font-family-name);
  font-size: 14px;
  line-height: 20px;

  &:hover {
    background-color: var(--md-sys-color-surface-container-highest-hover);
  }

  .icon {
    font-size: 18px;
  }
`

export const Text = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;

  strong {
    font-weight: 700;
  }
`

export const Form = styled.form`
  display: flex;
  align-items: center;
  height: 100%;
  min-width: 0;

  input {
    height: 100%;
    min-width: 240px;
    max-width: 50vw;
    field-sizing: content;
    padding: 6px 12px;
    border-radius: var(--border-radius-m) 0 0 var(--border-radius-m);
    background-color: var(--md-sys-color-surface-container-high);
    border: 1px solid var(--md-sys-color-outline);
    outline: none;
    font-size: 14px;
  }
`

export const PillButton = styled(Button)`
  height: 100%;
  padding: 6px;
  border-radius: 0;
  background-color: transparent;

  &:hover {
    background-color: var(--md-sys-color-surface-container-highest-hover);
  }

  &:disabled {
    background-color: transparent;
  }
`

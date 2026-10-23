import styled from 'styled-components'
import { Button } from '@ynput/ayon-react-components'

// Colour and spacing tokens (--settings-*) are declared on .settings-flat in SettingsEditor.sass

export const Group = styled.section`
  display: flex;
  flex-direction: column;
  min-width: 0;

  /* the addon title gets room of its own; the next addon starts well clear of it */
  &.settings-group-sheet {
    gap: var(--space-4);
    margin-bottom: calc(var(--space-8) + var(--space-4));
  }
`

export const Header = styled.header`
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
  min-height: var(--base-input-size);
  user-select: none;
  cursor: pointer;

  /* titles start where the text of the rows in the panels below starts */
  .settings-group-sheet > & {
    padding: 0 var(--settings-gutter);
  }

  /* titles stay in view while their group scrolls, so every setting shows where it belongs.
     The right side matches the rows below, so a title's switch lines up with theirs */
  .settings-group-card > & {
    position: sticky;
    top: 0;
    z-index: 4;
    min-height: var(--settings-card-title-height);
    padding: 0 var(--settings-gutter);
    background-color: var(--md-sys-color-background);
  }

  /* deeper titles stick under the ones above; the innermost covers its parents' */
  .settings-group-subgroup > & {
    position: sticky;
    top: calc(var(--settings-card-title-height) + var(--settings-subgroup-title-height));
    z-index: 2;
    min-height: var(--settings-subgroup-title-height);
    margin-top: var(--settings-subgroup-title-gap);
    padding: 0 var(--settings-gutter);
    background-color: var(--settings-surface, var(--settings-card-bg));
  }

  .settings-group-subgroup[data-settings-depth='2'] > & {
    top: var(--settings-card-title-height);
    z-index: 3;
    margin-top: var(--settings-section-title-gap);
  }

  /* a list's title is a setting's label inside a panel: it scrolls with its rows */
  .settings-group-subgroup.settings-group-list > & {
    position: static;
  }

  /* a section with a switch has no sticky title (its switch leads its first panel), so
     the sections inside it stick right under the card's title */
  .settings-group-leads-panel .settings-group-subgroup > & {
    top: var(--settings-card-title-height);
  }

  /* a section title is as far from its first setting as settings are from each other,
     and further from the content above it, so it reads with what follows */
  .settings-group-subgroup:not(.settings-group-list) > & {
    margin-bottom: var(--settings-section-title-after);
  }

  .settings-group-subgroup:not(.settings-group-list):not([data-settings-depth='2']) > & {
    margin-top: var(--settings-deep-section-title-gap);
  }

  /* list item titles keep the item rhythm, which their handle and X are centred on */
  .array-item-row
    > div
    > .settings-group-subgroup:not(.settings-group-list):not([data-settings-depth='2'])
    > & {
    margin-top: var(--settings-subgroup-title-gap);
  }

  /* reveal the dimmed actions button while the header is in use */
  &:hover .settings-group-actions,
  .settings-group-actions:focus-visible {
    opacity: 1;
  }
`

export const Title = styled.h4`
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
  margin: 0;
  padding: 0;
  border: 0;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-weight: 600;
  font-size: var(--md-sys-typescale-title-small-font-size);
  color: var(--md-sys-color-on-surface);

  /* addon 22px, card 16px, section 14px (field labels are 14px regular) */
  .settings-group-sheet > header > & {
    font-size: var(--md-sys-typescale-title-large-font-size);
  }

  .settings-group-card > header > & {
    font-size: var(--md-sys-typescale-title-medium-font-size);
  }

  /* a section's title sits above its panel, a step smaller than a card's */
  .settings-group-subgroup > header > & {
    font-size: var(--md-sys-typescale-title-small-font-size);
    color: var(--md-sys-color-on-surface);
  }

  /* a section inside a section has its panels beside its parent's, on the same edge:
     a lighter title tells it apart */
  .settings-group-subgroup:not(
      .settings-group-list,
      [data-settings-depth='2'],
      .array-item-row > div > *,
      .settings-folding-group > div > *
    )
    > header
    > & {
    font-weight: 500;
    color: var(--md-sys-color-on-surface-variant);
  }

  /* a list is a setting: its title reads like a field label */
  .settings-group-subgroup.settings-group-list > header > & {
    font-size: var(--md-sys-typescale-body-medium-font-size);
    font-weight: normal;
    text-transform: none;
    letter-spacing: normal;
    color: inherit;
  }

  /* a list item's title is its name, a value: never restyle its case */
  .array-item-row > div > .settings-group-subgroup > header > & {
    font-size: var(--md-sys-typescale-title-small-font-size);
    text-transform: none;
    letter-spacing: normal;
    color: var(--md-sys-color-on-surface);
  }

  /* a folding item reads like a row of a list: a lighter title than a section's */
  .array-item-row > div > .settings-group-foldable > header > &,
  .settings-folding-group > div > .settings-group-foldable > header > & {
    font-weight: 500;
  }

  .new-object {
    font-style: italic;
    color: var(--md-sys-color-on-surface-variant);
  }
`

// A card's content: no box of its own, its panels and sections sit on the sheet
export const Body = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
`

// Pushes the group's "enabled" switch to the end of the title row
export const HeaderToggle = styled.span`
  display: flex;
  align-items: center;
  margin-left: auto;

  /* a folded item's summary already takes the free room, so the switch follows it */
  .settings-group-summary ~ & {
    margin-left: 0;
  }
`

// The chevron of a list item that folds; it sits where the title starts
export const FoldButton = styled(Button)`
  &.settings-group-fold {
    flex: none;
    margin-left: -4px;
    padding: 2px;
    color: var(--md-sys-color-on-surface-variant);
  }
`

// A folded item's first values, dimmed at the end of its title row like a classic
// panel's description; the title keeps its room first
export const Summary = styled.span`
  flex: 0 1 auto;
  min-width: 0;
  max-width: 60%;
  margin-left: auto;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: var(--md-sys-typescale-label-medium-font-size);
  color: var(--md-sys-color-on-surface-variant);
`

export const ActionsButton = styled(Button)`
  opacity: 0.4;
  transition: opacity 0.15s;

  &.settings-group-actions {
    padding: 2px;
  }
`

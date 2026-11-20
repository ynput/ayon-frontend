import styled, { keyframes } from 'styled-components'

// A rail beside the sheet that stays in view while the sheet scrolls under it
export const Outline = styled.nav`
  position: sticky;
  top: 0;
  /* hidden, the rail keeps its column (SettingsEditor.sass), so the sheet never moves */
  overflow-x: hidden;
  overflow-y: auto;
  /* at its ends, a scroll over the rail stops there instead of moving the sheet */
  overscroll-behavior: contain;
  /* as tall as the panel it scrolls in, measured by SettingsOutline on every page */
  max-height: var(--settings-outline-height, calc(100dvh - 180px));
  /* the first link's text centres on the sheet's title, which is 32px tall */
  padding: 2px 0 16px;
  transition: opacity 0.2s ease, translate 0.25s ease;

  /* hidden: it fades and slides out, and leaves the tab order once it is gone */
  &.is-collapsed {
    opacity: 0;
    translate: -12px 0;
    visibility: hidden;
    pointer-events: none;
    transition: opacity 0.15s ease, translate 0.25s ease, visibility 0s linear 0.25s;
  }

  @media (prefers-reduced-motion: reduce) {
    &,
    &.is-collapsed {
      transition: none;
    }
  }

  /* the group being read, as the browser tracks it. After a click the clicked link is
     current instead (.is-current), until the sheet is scrolled by hand */
  &:not(.is-pinned) a:target-current {
    color: var(--md-sys-color-on-surface);
    background-color: var(--md-sys-color-surface-container);
  }

  ul {
    /* the browser tracks which link's group is in view (see useSettingsOutlineCurrent) */
    scroll-target-group: auto;
    /* the width of the grid column when the rail is shown */
    width: 200px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
`

// a name rolling in a loop (Link, is-rolling): a pause with its start in place, then a pass
// that brings its copy to where it started
const roll = keyframes`
  0%,
  12% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(var(--outline-roll-shift));
  }
`

export const Link = styled.a`
  display: block;
  padding: 4px 8px;
  border-radius: var(--border-radius-m);
  font-size: var(--md-sys-typescale-body-medium-font-size);
  color: var(--md-sys-color-on-surface-variant);
  text-decoration: none;

  &.settings-outline-card {
    margin-top: 8px;
    font-weight: 600;
    color: var(--md-sys-color-on-surface);
  }

  li:first-child > &.settings-outline-card {
    margin-top: 0;
  }

  /* a rail over several sheets (AddonSettings): each sheet heads its cards, so it takes
     the weight and the cards read as plain links under it */
  &.settings-outline-sheet {
    margin-top: 16px;
    font-weight: 600;
    color: var(--md-sys-color-on-surface);
  }

  li:first-child > &.settings-outline-sheet,
  li:has(> .settings-outline-sheet) + li > &.settings-outline-card {
    margin-top: 0;
  }

  ul:has(.settings-outline-sheet) &.settings-outline-card {
    font-weight: normal;
  }

  /* the rail is navigation, so it may show the hierarchy the sheet keeps flat */
  &.settings-outline-subgroup {
    padding-left: 20px;
  }

  /* the name's window: a long name ends in an ellipsis, cut at the link's padding */
  .settings-outline-label {
    display: block;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  /* its copy shows only while it rolls */
  .settings-outline-copy {
    display: none;
    padding-left: var(--outline-roll-gap);
  }

  /* on hover, a name cut short scrolls left in a loop (startRollingLink sets the distance and
     the time) */
  &.is-rolling .settings-outline-label {
    text-overflow: clip;
  }

  &.is-rolling .settings-outline-text {
    display: inline-block;
    animation: ${roll} var(--outline-roll-duration) linear infinite;
  }

  &.is-rolling .settings-outline-copy {
    display: inline;
  }

  /* reduced motion: the name stays cut, its tooltip shows it whole */
  @media (prefers-reduced-motion: reduce) {
    &.is-rolling .settings-outline-label {
      text-overflow: ellipsis;
    }

    &.is-rolling .settings-outline-text {
      display: inline;
      animation: none;
    }

    &.is-rolling .settings-outline-copy {
      display: none;
    }
  }

  &:hover,
  &:focus-visible {
    color: var(--md-sys-color-on-surface);
    background-color: var(--md-sys-color-surface-container);
  }

  /* the group being read: a filled background, the shape the links take on hover.
     Where the browser tracks it, the rail styles :target-current (see Outline) */
  &.is-current {
    color: var(--md-sys-color-on-surface);
    background-color: var(--md-sys-color-surface-container);
  }
`

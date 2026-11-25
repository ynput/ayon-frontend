import styled, { keyframes } from 'styled-components'

// A rail beside the sheet that stays in view while the sheet scrolls under it, with the
// handle that resizes it. Hidden, it keeps its column (SettingsEditor.sass), so the sheet
// never moves
export const Outline = styled.div`
  /* from the rail's edge to the resize line, the middle of the gap before the sheet */
  --settings-outline-line: calc(var(--settings-layout-gap, 24px) / 2);
  position: sticky;
  top: 0;
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

  /* links don't light up as the pointer crosses them while resizing */
  &.is-resizing a {
    pointer-events: none;
  }
`

// the links, scrolling on their own when they don't fit the panel
export const Rail = styled.nav`
  overflow-x: hidden;
  overflow-y: auto;
  /* at its ends, a scroll over the rail stops there instead of moving the sheet */
  overscroll-behavior: contain;
  /* as tall as the panel it scrolls in, measured by SettingsOutline on every page */
  max-height: var(--settings-outline-height, calc(100dvh - 180px));
  /* the first link's text centres on the sheet's title, which is 32px tall */
  padding: 2px 0 16px;
  /* it reaches the resize line, so its scrollbar sits against it. The padding keeps the links
     at the rail's width */
  margin-right: calc(-1 * var(--settings-outline-line));
  padding-right: var(--settings-outline-line);

  ul {
    /* the browser tracks which link's group is in view (see useSettingsOutlineCurrent) */
    scroll-target-group: auto;
    /* the rail's width (SettingsEditor.sass), so a long name ends in an ellipsis */
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
`

// The line between the rail and the sheet that resizes the rail (useSettingsOutlineResize), in the
// middle of their 24px gap. It looks like the app's splitters (SplitterStyles), and its grab area
// starts a little over the rail's scrollbar, which ends at the line
export const Resizer = styled.div`
  position: absolute;
  top: 0;
  right: calc(-1 * var(--settings-outline-line) - 10px);
  width: 13px;
  height: var(--settings-outline-height, 100%);
  cursor: col-resize;
  touch-action: none;

  &::before,
  &::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: 3px;
    translate: -50% 0;
    pointer-events: none;
  }

  &::before {
    width: 1px;
    background-color: var(--md-sys-color-outline-variant);
  }

  &::after {
    width: 4px;
    border-radius: 999px;
    background-color: var(--md-sys-color-primary);
    opacity: 0;
    transition: opacity 0.1s ease-out;
  }

  /* a short delay, so the bar doesn't flash when the pointer just passes over */
  &:hover::after {
    opacity: 0.75;
    transition-delay: 0.2s;
  }

  &:focus-visible {
    outline: none;
  }

  &:focus-visible::after,
  .is-resizing > &::after {
    opacity: 0.75;
    transition-delay: 0s;
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

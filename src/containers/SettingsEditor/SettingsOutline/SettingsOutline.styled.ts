import styled from 'styled-components'

// A rail beside the sheet that stays in view while the sheet scrolls under it
export const Outline = styled.nav`
  position: sticky;
  top: 0;
  /* the grid column shrinks to nothing when the rail is hidden (see SettingsEditor.sass),
     so the rail clips its list instead of reflowing it */
  overflow-x: hidden;
  overflow-y: auto;
  /* the scroll panel is a size container (AddonSettings); 100dvh is the fallback */
  max-height: calc(100dvh - 180px);
  max-height: 100cqh;
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

export const Link = styled.a`
  display: block;
  padding: 4px 8px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
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

  /* the rail is navigation, so it may show the hierarchy the sheet keeps flat */
  &.settings-outline-subgroup {
    padding-left: 20px;
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

import { createGlobalStyle } from 'styled-components'

// Sizes and parts shared by the dropdown menus (Menu / MenuContainer) and the right-click
// context menu, so both look the same. `.menu-large` is the bigger variant used by the header menus.
// A global style rather than a stylesheet, so addons that use the shared package without its
// style.css still get it. Rendered by MenuContainer and GlobalContextMenu.
export const MenuStyles = createGlobalStyle`
  :root {
    --menu-padding: 6px;
    --menu-gap: 4px;
    --menu-radius: var(--border-radius-l);
    --menu-shadow: var(--md-sys-elevation-overlay);
    /* a subtle outline around the popover */
    --menu-border-width: 1px;
    --menu-border-color: var(--md-sys-color-outline-variant);
    --menu-item-height: 32px;
    --menu-item-padding: 4px 12px 4px 10px;
    --menu-item-gap: 8px;
    --menu-item-radius: var(--border-radius-m);
    --menu-divider-margin: 2px;
  }

  .menu-large {
    --menu-padding: 8px;
    --menu-gap: 8px;
    --menu-item-padding: 6px 16px 6px 12px;
    --menu-divider-margin: 0px;
  }

  /* the keyboard shortcut at the end of a row: plain text, not a tag, so it doesn't compete with the label */
  div.menu-shortcut {
    margin-left: auto;
    padding-left: 32px;

    & > * {
      padding: 0;
      background-color: transparent;
      color: var(--md-sys-color-outline);
      font-size: var(--md-sys-typescale-body-small-font-size);
      line-height: var(--md-sys-typescale-body-small-line-height);
      letter-spacing: var(--md-sys-typescale-body-small-letter-spacing);
    }
  }
`

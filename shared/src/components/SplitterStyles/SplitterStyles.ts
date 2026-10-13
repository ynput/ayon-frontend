import { createGlobalStyle } from 'styled-components'

// Styles every PrimeReact Splitter gutter on the page (including ones rendered by other libraries).
// Idle: subtle three dots in the middle hint the gap is resizable.
// Hover/drag: the dots fade out and a full-length primary pill fades in.
// Render once near the root of the app/addon: <SplitterStyles />
export const SplitterStyles = createGlobalStyle`
  .p-splitter > .p-splitter-gutter {
    position: relative;

    /* widen the grab area without changing the layout gap */
    &::after {
      content: '';
      position: absolute;
      inset: 0;
      z-index: 1;
    }

    /* subtle three dots in the middle (the other two are box-shadows, see layouts below) */
    &::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 2px;
      height: 2px;
      border-radius: 50%;
      translate: -50% -50%;
      background: var(--md-sys-color-outline);
      pointer-events: none;
      transition: opacity 0.1s ease-out;
    }

    /* short delay so the handle doesn't flash when the cursor just passes over */
    &:hover::before {
      opacity: 0;
      transition-delay: 0.2s;
    }

    &.p-splitter-gutter-resizing::before {
      opacity: 0;
      transition-delay: 0s;
    }

    /* collapsed gutters (gutterSize 0) show no dots and have no grab area */
    &[style*='width: 0px'],
    &[style*='height: 0px'] {
      &::before,
      &::after {
        display: none;
      }
    }
  }

  /* extra specificity to beat the PrimeReact and ayon-react-components handle styles in any load order */
  .p-splitter.p-component > .p-splitter-gutter > .p-splitter-gutter-handle {
    width: 100%;
    height: 100%;
    border-radius: 999px;
    background: var(--md-sys-color-primary);
    opacity: 0;
    transition: opacity 0.1s ease-out;
  }
  .p-splitter.p-component > .p-splitter-gutter:hover > .p-splitter-gutter-handle {
    opacity: 1;
    transition-delay: 0.2s;
  }
  .p-splitter.p-component > .p-splitter-gutter.p-splitter-gutter-resizing > .p-splitter-gutter-handle {
    opacity: 1;
    transition-delay: 0s;
  }

  .p-splitter-horizontal > .p-splitter-gutter {
    &::before {
      box-shadow:
        0 -5px 0 var(--md-sys-color-outline),
        0 5px 0 var(--md-sys-color-outline);
    }
    &::after {
      inset: 0 -3px;
    }
  }

  .p-splitter-vertical > .p-splitter-gutter {
    &::before {
      box-shadow:
        -5px 0 0 var(--md-sys-color-outline),
        5px 0 0 var(--md-sys-color-outline);
    }
    &::after {
      inset: -3px 0;
    }
  }
`

export default SplitterStyles

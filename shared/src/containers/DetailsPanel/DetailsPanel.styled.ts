import styled from 'styled-components'
import { Panel as ARCPanel } from '@ynput/ayon-react-components'

export const Panel = styled(ARCPanel)`
  gap: 0px;
  height: 100%;
  padding: 0px;
  box-shadow: -2px 0 6px #00000047;
  z-index: 300;

  /* the panel's own parts only (child selectors), not those of a panel inside one of its tabs */

  /* the path's menus may reach past the frame; each tab scrolls in itself */
  & > .tabbed-panel {
    overflow: visible;
  }

  /* the entity path at its own width: it hides segments to fit what the tools leave (EntityPath) */
  & > .tabbed-panel > .tabbed-panel-top > .tabbed-panel-title {
    display: flex;
    /* the tools' height: the path is centred on them */
    height: 32px;
    /* the path's menus (hidden segments, versions) open below it */
    overflow: visible;

    & > * {
      min-width: max-content;
    }
  }

  &.preview {
    box-shadow: none;
    border-radius: 8px;
    z-index: auto;
    overflow: hidden;
    background-color: var(--md-sys-color-surface-container-low);
  }

  /* the tools cover the end of a path that does not fit, out to the panel's edge on the right */
  & > .tabbed-panel > .tabbed-panel-top > .tabbed-panel-tools {
    position: relative;
    background-color: var(--md-sys-color-surface-container-low);
    box-shadow: calc(-1 * var(--padding-m)) 0 0 var(--md-sys-color-surface-container-low),
      var(--padding-m) 0 0 var(--md-sys-color-surface-container-low);
  }
`

// isPreview: a recessed panel (darker, no shadow) inside the window that shows it
// the path is where the entity is; its segments don't open anything from a preview
export const PreviewPath = styled.div`
  flex: none;
  pointer-events: none;
  display: flex;
  align-items: center;
  height: 32px;
  padding: 4px 8px 0;
  overflow: hidden;
`

export const PreviewSection = styled.section`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--md-sys-color-outline-variant);
  margin-top: var(--padding-m);

  h4 {
    flex: none;
    margin: 0;
    padding: var(--padding-m) var(--padding-m) 0;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--md-sys-color-on-surface-variant);
  }

  & > :last-child {
    flex: 1;
    min-height: 0;
  }
`

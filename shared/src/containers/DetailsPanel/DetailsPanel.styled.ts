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

  /* the tools cover the end of a path that does not fit, out to the panel's edge on the right */
  & > .tabbed-panel > .tabbed-panel-top > .tabbed-panel-tools {
    position: relative;
    background-color: var(--md-sys-color-surface-container-low);
    box-shadow: calc(-1 * var(--padding-m)) 0 0 var(--md-sys-color-surface-container-low),
      var(--padding-m) 0 0 var(--md-sys-color-surface-container-low);
  }
`

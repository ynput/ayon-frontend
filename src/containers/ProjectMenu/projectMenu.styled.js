import { Button } from '@ynput/ayon-react-components'
import { Sidebar } from 'primereact/sidebar'
import styled from 'styled-components'

// a dropdown under the context pill: left, top and height come from the pill
export const ProjectSidebar = styled(Sidebar)`
  border-radius: var(--border-radius-l);

  background: none;

  box-shadow: var(--md-sys-elevation-overlay);

  overflow: hidden;

  /* it drops down from the pill: a short fade instead of the drawer's slide in from the left */
  &&.p-sidebar-enter {
    opacity: 0;
    transform: translateY(-4px);
  }
  &&.p-sidebar-enter-active {
    opacity: 1;
    transform: none;
    transition: opacity 0.1s ease-out, transform 0.1s ease-out;
  }

  h3 {
    border: none;
    padding-left: var(--padding-m);
    font-weight: 700;
  }

  .p-sidebar-content {
    padding: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: var(--base-gap-large);

    section {
      background-color: var(--md-sys-color-surface-container-high);
      color: var(--md-sys-color-on-surface);
      border-radius: var(--border-radius-l);
      gap: var(--base-gap-large);
      padding: 8px;
      overflow: hidden;

      menu {
        padding: 0;
      }
    }

    .menu-list {
      overflow: auto;
      flex: 1;
      border-radius: 0;
      top: 0 !important;
      height: 100%;
      background: transparent !important;

      /* Make sure table inside is also transparent */
      table {
        background: transparent !important;
      }
    }
  }

  .p-sidebar-header {
    display: none;
  }

  .menu-item {
    justify-content: space-between;
  }
`

export const All = styled.div`
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-small);

  menu {
    flex: 1;
  }
  /* Override hover color for rows in menu */
  .menu-list td > div:hover {
    background-color: var(--md-sys-color-surface-container-high-hover);
  }
`

export const Divider = styled.hr`
  margin: 0;
  width: 100%;
  border-style: solid;
  opacity: 0.5;
  border-color: var(--md-sys-color-surface-container-highest);
`

export const Search = styled(Button)`
  position: absolute;
  right: 4px;
  top: 4px;
  width: min-content;
  padding: 4px;
`

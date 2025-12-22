import { Button } from '@ynput/ayon-react-components'
import { Sidebar } from 'primereact/sidebar'
import styled, { keyframes } from 'styled-components'

export const ProjectSidebar = styled(Sidebar)`
  /* height: calc(100% - 42px - 8px) !important;
  top: 42px; */
  margin-left: 8px;
  top: 8px;
  height: calc(100% - 16px) !important;

  background: none;

  box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.15);

  overflow: hidden;

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

const FadeInAnimation = keyframes`
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
`

export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 500;
  background-color: rgba(0, 0, 0, 0.5);
  animation: ${FadeInAnimation} 0.1s ease-in-out;
`

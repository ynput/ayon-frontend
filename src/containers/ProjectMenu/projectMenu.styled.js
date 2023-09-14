import { Sidebar } from 'primereact/sidebar'
import styled from 'styled-components'

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
    color: var(--md-sys-color-outline);
  }

  .p-sidebar-content {
    padding: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 8px;

    section {
      background-color: var(--md-sys-color-surface-container-high);
      color: var(--md-sys-color-on-surface);
      border-radius: var(--border-radius-l);
      gap: 8px;
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
  max-height: 50%;
`

export const Divider = styled.hr`
  margin: 0;
  width: 100%;
  border-style: solid;
  opacity: 0.5;
  border-color: var(--md-sys-color-surface-container-highest);
`

export const Header = styled.header`
  padding-bottom: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  position: relative;

  button {
    justify-content: flex-start;
    padding: 6px 12px;
  }

  input,
  button {
    width: 100%;
  }
`

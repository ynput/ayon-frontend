import { Dropdown } from '@ynput/ayon-react-components'
import styled from 'styled-components'

export const Container = styled.div`
  border-radius: var(--border-radius-m);
  overflow: hidden;
  background-color: var(--md-sys-color-surface-container-low);
  flex: 1;

  display: flex;
  flex-direction: column;
`

export const Header = styled.div`
  padding: var(--padding-s);
  padding-bottom: 0;
  width: 100%;

  border-bottom: 1px solid var(--md-sys-color-outline-variant);
`
export const SlicerDropdown = styled(Dropdown)`
  width: 100%;
  .template-value {
    border: 0;
  }
`

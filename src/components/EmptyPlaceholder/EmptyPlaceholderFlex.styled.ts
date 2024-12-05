import styled from 'styled-components'
import EmptyPlaceholder from './EmptyPlaceholder'

export const EmptyPlaceholderFlex = styled(EmptyPlaceholder)`
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex-grow: 1;
  position: relative;
  max-width: 100%;
  overflow: hidden;
  top: 0;
  left: 0;
  transform: none;
  gap: 8px;
  .icon {
    font-size: 34px;
  }
  h3 {
    font-size: 18px;
  }
`
export const EmptyPlaceholderFlexWrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;

  position: relative;
  height: 100%;
  border-radius: var(--border-radius-m);

  background: var(--md-sys-color-surface-container-low);
  .header {
    margin: 0;
    padding: 9.4px 8px;
    text-transform: capitalize;
  }
`

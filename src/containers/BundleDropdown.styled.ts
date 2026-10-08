import styled from 'styled-components'
import { DefaultValueTemplate } from '@ynput/ayon-react-components'

export const BundleDropdownItemStyled = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  padding-right: 12px;
  gap: var(--base-gap-small);

  &.active {
    background-color: var(--md-sys-color-primary-container);
    color: var(--md-sys-color-on-primary-container);

    &:hover {
      background-color: var(--md-sys-color-primary-container-hover);
    }
  }
`

export const DefaultValueTemplateStyled = styled(DefaultValueTemplate)`
  padding-left: 0;
  & > div > span {
    flex: 1;
  }
`

import { Button } from '@ynput/ayon-react-components'
import styled from 'styled-components'

export const SettingOption = styled(Button)`
  width: 100%;
  justify-content: flex-start;
  margin-bottom: 8px;
  text-align: left;
  display: flex;
  gap: var(--base-gap-small);
  padding-right: var(--padding-s);
  padding-left: var(--padding-m);

  .title {
    flex: 1;
  }

  .preview,
  .arrow {
    color: var(--md-sys-color-outline);
  }
`

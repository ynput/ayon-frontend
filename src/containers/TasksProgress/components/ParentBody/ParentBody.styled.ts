import styled from 'styled-components'
import { Body } from '../FolderBody/FolderBody.styled'
import { theme } from '@ynput/ayon-react-components'

export const ParentBody = styled(Body)`
  & > * {
    ${theme.titleMedium}
    font-weight: 600;
  }
`

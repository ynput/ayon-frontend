import { Toolbar } from '@ynput/ayon-react-components'
import styled from 'styled-components'

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`

export const Header = styled(Toolbar)``
export const Content = styled.div`
  flex: 1;
  min-height: 80vh;
  display: flex;
  justify-content: center;
  align-items: center;

  h2 {
    font-size: 2rem;
  }
`

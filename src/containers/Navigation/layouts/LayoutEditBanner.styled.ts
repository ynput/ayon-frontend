import styled from 'styled-components'
import * as RestartStyled from '@components/RestartBanner/RestartBanner.styled'

// the restart banner's bar, in the page's flow under the sidebar and the page: it covers neither
export const Banner = styled(RestartStyled.Banner)`
  position: relative;
  flex-shrink: 0;
`

export const Main = RestartStyled.Main

import { getShimmerStyles } from '@ynput/ayon-react-components'
import styled from 'styled-components'

export const ReviewablesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-small);

  overflow: auto;
`

export const LoadingCard = styled.div`
  position: relative;
  overflow: hidden;
  border-radius: var(--border-radius-m);
  width: 100%;
  min-height: 48px;

  ${getShimmerStyles()}
`

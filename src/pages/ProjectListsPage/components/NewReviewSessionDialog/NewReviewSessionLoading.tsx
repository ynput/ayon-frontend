import { Icon, theme } from '@ynput/ayon-react-components'
import styled from 'styled-components'

const StyledContainer = styled.div`
  position: absolute;
  inset: 0;

  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: var(--base-gap-large);
  user-select: none;

  .icon {
    font-size: 3rem;
  }
`

const StyledIcons = styled.div`
  display: flex;
  gap: var(--base-gap-large);

  animation: pulseOpacity 1s infinite alternate;
  @keyframes pulseOpacity {
    0% {
      opacity: 1;
    }
    100% {
      opacity: 0.3;
    }
  }
`

const StyledLabel = styled.span`
  ${theme.bodyLarge}
  color: var(--md-sys-color-outline);
`

const NewReviewSessionLoading = () => {
  return (
    <StyledContainer>
      <StyledIcons>
        <Icon icon="layers" />
        <Icon icon="arrow_right_alt" className="arrow" />
        <Icon icon="subscriptions" />
      </StyledIcons>
      <StyledLabel>Creating review session...</StyledLabel>
    </StyledContainer>
  )
}

export default NewReviewSessionLoading

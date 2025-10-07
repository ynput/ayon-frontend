import { Button, Icon } from '@ynput/ayon-react-components'
import { forwardRef } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-radius: var(--border-radius-l);
  background-color: var(--md-sys-color-secondary-container);
  padding: var(--padding-m);
`

interface RequiredPowerpackVersionProps extends React.HTMLAttributes<HTMLDivElement> {
  requiredVersion: string | undefined | null
}

export const RequiredPowerpackVersion = forwardRef<HTMLDivElement, RequiredPowerpackVersionProps>(
  ({ requiredVersion, ...props }, ref) => {
    if (!requiredVersion) return 'Required Powerpack version installed already.'
    return (
      <StyledContainer {...props} ref={ref}>
        <span>{`Power Features version ${requiredVersion} is required to use this feature.`}</span>
        <Link to={`/market?selected=powerpack`}>
          <Button variant="tertiary">
            Update Power Features <Icon icon="arrow_right_alt" />
          </Button>
        </Link>
      </StyledContainer>
    )
  },
)

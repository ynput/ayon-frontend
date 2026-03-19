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

type BaseProps = React.HTMLAttributes<HTMLDivElement> & {
  requiredVersion: string | undefined | null
}

type RequiredAddonVersionProps = BaseProps &
  (
    | {
        addonName: string
        addonLabel: string
      }
    | {
        addonName?: never
        addonLabel?: never
      }
  )

export const RequiredAddonVersion = forwardRef<HTMLDivElement, RequiredAddonVersionProps>(
  ({ requiredVersion, addonName, addonLabel, ...props }, ref) => {
    const name = addonName || 'powerpack'
    const label = addonLabel || 'Power Features'

    if (!requiredVersion) return `Required ${label} version installed already.`
    return (
      <StyledContainer {...props} ref={ref}>
        <span>{`${label} version ${requiredVersion} is required to use this feature.`}</span>
        <Link to={`/market?selected=${name}`}>
          <Button variant="tertiary">
            Update {label} <Icon icon="arrow_right_alt" />
          </Button>
        </Link>
      </StyledContainer>
    )
  },
)

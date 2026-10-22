import { FreeTrialLink } from '@shared/components/Powerpack'
import { theme } from '@ynput/ayon-react-components'
import clsx from 'clsx'
import { FC } from 'react'
import styled from 'styled-components'

const Chip = styled(FreeTrialLink)`
  display: flex;
  user-select: none;

  span {
    ${theme.labelLarge}
  }
`

const Pro = styled.span`
  padding: 2px 6px;
  color: var(--color-sub-pro);
  border: solid 1px var(--color-sub-pro);
  /* border radius left */
  border-radius: 4px 0 0 4px;

  &.included {
    background-color: var(--color-sub-pro);
    color: var(--color-on-sub-pro);

    &:hover {
      background-color: var(--color-sub-pro-hover);
      border-color: var(--color-sub-pro-hover);
    }
  }
`

const Studio = styled.span`
  padding: 2px 6px;
  color: var(--color-sub-studio);
  border: solid 1px var(--color-sub-studio);
  /* border radius right */
  border-radius: 0 4px 4px 0;

  &.only {
    border-radius: 4px;
  }

  &.included {
    background-color: var(--color-sub-studio);
    color: var(--color-on-sub-studio);

    &:hover {
      background-color: var(--color-sub-studio-hover);
      border-color: var(--color-sub-studio-hover);
    }
  }
`

interface SubChipProps {
  includedWithPro?: boolean // is it included with Pro sub?
  includedWithStudio?: boolean // is it included with Studio sub? (default true)
  studioOnly?: boolean // not available with Pro sub at all
  size?: 'sm' | 'md'
}

const SubChip: FC<SubChipProps> = ({
  size = 'md',
  includedWithPro = false,
  includedWithStudio = true,
  studioOnly = false,
}) => {
  const proLabel = size === 'md' ? 'Pro' : 'P'
  const studioLabel = size === 'md' ? (studioOnly ? 'Studio only' : 'Studio') : 'S'

  if (studioOnly) {
    return (
      <Chip>
        <Studio
          data-tooltip="Only available with AYON Studio subscription"
          data-tooltip-delay={0}
          className={clsx('only', { included: includedWithStudio })}
        >
          {studioLabel}
        </Studio>
      </Chip>
    )
  }

  return (
    <Chip>
      <Pro
        className={clsx({ included: includedWithPro })}
        data-tooltip={
          includedWithPro
            ? 'Included with AYON Pro subscription'
            : 'Available as a paid addon with AYON Pro subscription'
        }
        data-tooltip-delay={0}
      >
        {proLabel}
      </Pro>
      <Studio
        data-tooltip={
          includedWithStudio
            ? 'Included with AYON Studio subscription'
            : 'Available as a paid addon with AYON Studio subscription'
        }
        data-tooltip-delay={0}
        className={clsx({ included: includedWithStudio })}
      >
        {studioLabel}
      </Studio>
    </Chip>
  )
}

export default SubChip

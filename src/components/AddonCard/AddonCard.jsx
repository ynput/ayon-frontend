import React from 'react'
import * as Styled from './AddonCard.styled'
import { Icon } from '@ynput/ayon-react-components'
import Type from '/src/theme/typography.module.css'

const AddonCard = React.forwardRef(
  ({ name, icon = 'check_circle', isSelected, error, ...props }, ref) => {
    console.log(error)
    return (
      <Styled.AddonCard ref={ref} $selected={isSelected} $error={!!error} {...props}>
        <Icon icon={icon} />
        <span className={Type.titleSmall}>{name}</span>
        {error && <span className="error">{error}</span>}
      </Styled.AddonCard>
    )
  },
)

AddonCard.displayName = 'AddonCard'

export default AddonCard

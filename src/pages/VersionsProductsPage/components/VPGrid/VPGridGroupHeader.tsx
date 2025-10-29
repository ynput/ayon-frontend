import { FC } from 'react'
import { Button, Icon } from '@ynput/ayon-react-components'
import clsx from 'clsx'
import * as Styled from './VPGridGroupHeader.styled'

export interface GridGroupHeaderProps {
  label: string
  value: string
  icon?: string
  color?: string
  count?: number
  isExpanded: boolean
  onToggle: () => void
}

export const VPGridGroupHeader: FC<GridGroupHeaderProps> = ({
  label,
  icon,
  color,
  count,
  isExpanded,
  onToggle,
}) => {
  return (
    <Styled.GroupWrapper>
      <Styled.GroupHeader onClick={onToggle} className={clsx({ collapsed: !isExpanded })}>
        <Styled.Content>
          <Button icon="expand_more" className="expand-icon" variant="text" />
          {icon && <Icon icon={icon} style={{ color: color || undefined }} />}
          <Styled.Label>{label}</Styled.Label>
        </Styled.Content>
      </Styled.GroupHeader>
    </Styled.GroupWrapper>
  )
}

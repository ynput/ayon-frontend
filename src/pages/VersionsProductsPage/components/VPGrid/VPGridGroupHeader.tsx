import { FC } from 'react'
import { Button, Icon, getReadableColor } from '@ynput/ayon-react-components'
import clsx from 'clsx'
import * as Styled from './VPGridGroupHeader.styled'

export interface GridGroupHeaderProps {
  label: string
  value: string
  icon?: string
  color?: string
  colorLight?: string | null
  count?: number
  isExpanded: boolean
  onToggle: () => void
}

export const VPGridGroupHeader: FC<GridGroupHeaderProps> = ({
  label,
  icon,
  color,
  colorLight,
  count,
  isExpanded,
  onToggle,
}) => {
  const handleOnClick = (_e: React.MouseEvent<HTMLDivElement>) => {
    onToggle()
  }

  return (
    <Styled.GroupWrapper>
      <Styled.GroupHeader onClick={handleOnClick} className={clsx({ collapsed: !isExpanded })}>
        <Styled.Content>
          <Button icon="expand_more" className="expand-icon" variant="text" />
          {icon && <Icon icon={icon} style={{ color: getReadableColor({ color, colorLight }) }} />}
          <Styled.Label>{label}</Styled.Label>
          {/* {count !== undefined && <Styled.Count>{count < 1 ? 'Empty' : count}</Styled.Count>} */}
        </Styled.Content>
      </Styled.GroupHeader>
    </Styled.GroupWrapper>
  )
}

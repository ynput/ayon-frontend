import { FC } from 'react'
import { Button, Icon } from '@ynput/ayon-react-components'
import { ValuePill } from '@shared/components'
import type { PillStyle } from '@shared/util'
import clsx from 'clsx'
import * as Styled from './VPGridGroupHeader.styled'

export interface GridGroupHeaderProps {
  label: string
  value: string
  icon?: string
  color?: string
  colorLight?: string | null
  count?: number
  // a coloured group value shows as a pill, like the table group headers: filled for a status, tinted otherwise
  pill: PillStyle
  isExpanded: boolean
  onToggle: () => void
}

export const VPGridGroupHeader: FC<GridGroupHeaderProps> = ({
  label,
  icon,
  color,
  colorLight,
  count,
  pill,
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
          {color ? (
            <ValuePill
              variant={pill}
              className="group-pill"
              {...{ label, icon, color, colorLight }}
            />
          ) : (
            <>
              {icon && <Icon icon={icon} />}
              <Styled.Label>{label}</Styled.Label>
            </>
          )}
          {/* {count !== undefined && <Styled.Count>{count < 1 ? 'Empty' : count}</Styled.Count>} */}
        </Styled.Content>
      </Styled.GroupHeader>
    </Styled.GroupWrapper>
  )
}

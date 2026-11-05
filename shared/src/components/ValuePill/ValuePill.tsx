import { Icon } from '@ynput/ayon-react-components'
import clsx from 'clsx'
import { getPillColors, type PillStyle } from '@shared/util/pillColors'
import * as Styled from './ValuePill.styled'

export interface ValuePillProps extends React.HTMLAttributes<HTMLSpanElement> {
  label: string
  icon?: string
  color?: string
  colorLight?: string | null
  // filled for statuses, tinted for tags and other coloured values (see getPillColors)
  variant: PillStyle
}

// A coloured value (status, tag, priority, ...) outside the tables, shown like it is in the table cells
export const ValuePill = ({
  label,
  icon,
  color,
  colorLight,
  variant,
  className,
  style,
  ...props
}: ValuePillProps) => {
  const colors = color ? getPillColors({ color, colorLight }, variant) : undefined

  return (
    <Styled.Pill
      title={label}
      {...props}
      className={clsx({ plain: !colors, 'has-icon': !!icon }, className)}
      style={{ ...colors, ...style }}
    >
      {icon && <Icon icon={icon} />}
      <span className="label">{label}</span>
    </Styled.Pill>
  )
}

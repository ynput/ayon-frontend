import { FC } from 'react'
import { Shortcut } from './ShortcutWidget.styled'

interface ShortcutWidgetProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode
  align?: 'left' | 'right'
  style?: React.CSSProperties
  className?: string
}

const ShortcutWidget: FC<ShortcutWidgetProps> = ({
  children,
  align,
  style,
  className = '',
  ...props
}) => {
  const alignStyle = {
    marginLeft: align === 'right' ? 'auto' : '0',
    marginRight: align === 'left' ? 'auto' : '0',
  }

  return (
    <Shortcut style={{ ...alignStyle, ...style }} className={`shortcut ${className}`} {...props}>
      {children}
    </Shortcut>
  )
}

export default ShortcutWidget

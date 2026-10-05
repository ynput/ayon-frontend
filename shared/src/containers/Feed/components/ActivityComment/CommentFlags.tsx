import { Icon, type IconType } from '@ynput/ayon-react-components'
import * as Styled from './ActivityComment.styled'

export interface CommentFlag {
  id: string
  label: string
  icon?: IconType
  tooltip?: string
  onClick?: () => void
  disabled?: boolean
  testId?: string
}

const CommentFlags = ({ flags }: { flags: CommentFlag[] }) => {
  if (!flags.length) return null

  return (
    <Styled.Flags>
      {flags.map(({ id, label, icon, tooltip, onClick, disabled, testId }) => (
        <Styled.Flag
          key={id}
          as={onClick ? 'button' : 'span'}
          type={onClick ? 'button' : undefined}
          onClick={onClick}
          disabled={onClick ? disabled : undefined}
          data-tooltip={tooltip}
          data-tooltip-delay={0}
          data-testid={testId}
        >
          {icon && <Icon icon={icon} />}
          {label}
        </Styled.Flag>
      ))}
    </Styled.Flags>
  )
}

export default CommentFlags

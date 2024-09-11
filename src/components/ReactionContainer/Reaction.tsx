import clsx from 'clsx'
import * as Styled from './ReactionStyles.styled'
import { reactionMappingObj } from './values'
import { MouseEventHandler } from 'react'

type Props = {
  reaction: Reaction
  isActive?: boolean
  variant?: ReactionComponentVariant
  onClick: MouseEventHandler
}

const Reaction = ({ reaction, variant = 'standard', onClick }: Props) => {
  const users = reaction.users?.join(', ') || undefined

  return (
    <Styled.Reaction
      className={clsx(variant, { active: reaction.isActive })}
      onClick={onClick}
      data-tooltip={users}
    >
      {reactionMappingObj[reaction.type]}
      {reaction.count && <span>{reaction.count}</span>}
    </Styled.Reaction>
  )
}

export default Reaction

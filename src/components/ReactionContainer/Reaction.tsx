import clsx from 'clsx'
import * as Styled from './Reactions.styled'
import { reactionMappingObj } from './helpers'
import { MouseEventHandler } from 'react'
import { Reaction as ReactionType, ReactionComponentVariant } from './types'

type Props = {
  reaction: ReactionType
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
      <span className="emoji">
        {reactionMappingObj[reaction.type]}
      </span>
        {reaction.users && <span>{reaction.users.length}</span>}
    </Styled.Reaction>
  )
}

export default Reaction

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

const Reaction = ({ reaction, variant = 'standard', onClick}: Props) => {
  return (
    <Styled.Reaction
      className={clsx(variant, { active: reaction.isActive })}
      onClick={onClick}
    >
      {reactionMappingObj[reaction.type]}
      {reaction.count && <span>{reaction.count}</span>}
    </Styled.Reaction>
  )
}

export default Reaction

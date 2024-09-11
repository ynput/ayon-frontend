import clsx from 'clsx'
import * as Styled from './ReactionStyles.styled'
import { reactionMappingObj } from './values'

type Props = {
  reaction: Reaction
  isActive?: boolean
}

const Reaction = ({ reaction, isActive }: Props) => {
  return (
    <Styled.Reaction className={clsx({ active: isActive })}>
      {reactionMappingObj[reaction.type]} <span>{reaction.userIds.length}</span>
    </Styled.Reaction>
  )
}

export default Reaction

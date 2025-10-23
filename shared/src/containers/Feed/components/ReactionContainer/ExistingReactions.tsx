import ReactionComponent from './Reaction'
import * as Styled from './Reactions.styled'
import { Reaction } from './types'

type Props = {
  reactions: Reaction[]
  changeHandler: (reaction: Reaction) => void
  categoryPrimary?: string
  categorySecondary?: string
  categoryTertiary?: string
}

const ExistingReactions = ({
  reactions,
  changeHandler,
  categoryPrimary,
  categorySecondary,
  categoryTertiary,
}: Props) => {
  return (
    <Styled.ActiveReactionsList>
      {reactions.map((reaction) => (
        <ReactionComponent
          key={reaction.type}
          reaction={reaction}
          isActive={reaction.isActive}
          onClick={() => {
            changeHandler({ ...reaction, isActive: !reaction.isActive })
          }}
          categoryPrimary={categoryPrimary}
          categorySecondary={categorySecondary}
          categoryTertiary={categoryTertiary}
        />
      ))}
    </Styled.ActiveReactionsList>
  )
}

export default ExistingReactions

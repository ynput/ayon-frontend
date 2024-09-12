import ReactionComponent from './Reaction'
import * as Styled from './ReactionStyles.styled'
import { Reaction } from './types'

type Props = {
  reactions: Reaction[]
  changeHandler: (reaction: Reaction) => void
}

const ExistingReactions = ({ reactions, changeHandler }: Props) => {
  return (
    <Styled.ActiveReactionsList>
      {reactions.map((reaction) => (
        <ReactionComponent
          reaction={reaction}
          isActive={reaction.isActive}
          onClick={() => {
            changeHandler({ ...reaction, isActive: !reaction.isActive })
          }}
        />
      ))}
    </Styled.ActiveReactionsList>
  )
}

export default ExistingReactions

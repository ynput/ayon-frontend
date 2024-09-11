import Reaction from './Reaction'
import * as Styled from './ReactionStyles.styled'

type Props = {
  reactions: Reaction[]
  changeHandler: (reaction: Reaction) => {}
}

const ExistingReactions = ({ reactions, changeHandler }: Props) => {
  return (
    <Styled.ActiveReactionsList>
      {reactions.map((reaction) => (
        <Reaction
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

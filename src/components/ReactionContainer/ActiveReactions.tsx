import Reaction from './Reaction'
import * as Styled from './ReactionStyles.styled'

const ActiveReactions = ({ reactions }: { reactions: Reaction[] }) => {
  return (
    <Styled.ActiveReactionsList>
      {reactions.map((reaction) => (
        <Reaction reaction={reaction} isActive={Math.random() < 0.5}/>
      ))}
    </Styled.ActiveReactionsList>
  )
}

export default ActiveReactions

import * as Styled from './ReactionStyles.styled'
import { reactionMapping } from './values'


const ReactionPanel = () => {
  return (
    <Styled.ReactionsPanel>
      {reactionMapping.map((reaction) => (
        <span className="emoji">{reaction.value}</span>
      ))}
    </Styled.ReactionsPanel>
  )
}
export default ReactionPanel
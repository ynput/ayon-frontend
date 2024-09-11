import ActiveReactions from "./ActiveReactions"
import ReactionPanelOpener from "./ReactionPanelOpener"
import * as Styled from './ReactionStyles.styled'

const ReactionsWrapper = ({ reactions }: { reactions: Reaction[] }) => {
  return (
    <Styled.ReactionsWrapper>
      <ReactionPanelOpener />
      <ActiveReactions reactions={reactions} />
    </Styled.ReactionsWrapper>
  )
}

export default ReactionsWrapper
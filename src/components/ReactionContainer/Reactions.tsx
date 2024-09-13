import ExistingReactions from "./ExistingReactions"
import ReactionPanelOpener from "./ReactionPanelOpener"
import * as Styled from './ReactionStyles.styled'
import { Reaction } from "./types"

type Props = {
  reactions: Reaction[]
  isActivePopup: boolean,
  changeHandler: (reaction: Reaction) => void
  toggleActivePopup: (value: boolean) => void
}

const Reactions = ({
  reactions,
  isActivePopup,
  changeHandler,
  toggleActivePopup,
}: Props) => {
  return (
    <Styled.ReactionsWrapper>
      <ReactionPanelOpener
        reactions={reactions}
        isActivePopup={isActivePopup}
        changeHandler={changeHandler}
        toggleActivePopup={toggleActivePopup}
      />
      <ExistingReactions reactions={reactions} changeHandler={changeHandler} />
    </Styled.ReactionsWrapper>
  )
}

export default Reactions
import { Icon } from "@ynput/ayon-react-components"
import * as Styled from './ReactionStyles.styled'
import { reactionMapping } from "./helpers"
import { Reaction as ReactionType } from "./types"
import Reaction from "./Reaction"

type Props = {
  reactions: ReactionType[]
  isActivePopup: boolean
  changeHandler: (reaction: ReactionType) => void
  toggleActivePopup: (value: boolean) => void
}

const ReactionPanelOpener = ({reactions, isActivePopup, changeHandler, toggleActivePopup}: Props) => {

  const activeReactions = reactions
    .filter((reaction) => reaction.isActive)
    .map((reaction) => reaction.type)

  return (
    <Styled.ReactionPanelOpener>
      <Icon
        icon="add_reaction"
        className="add-reaction"
        onClick={() => toggleActivePopup(!isActivePopup)}
      />
      {isActivePopup && (
        <Styled.ReactionsPanel>
          {reactionMapping.map((reaction) => {
            const reactionObj = {
              type: reaction.key,
              isActive: activeReactions.includes(reaction.key),
            }
            return (
              <Reaction
                key={reactionObj.type}
                reaction={reactionObj}
                variant="compact"
                onClick={() => {
                  changeHandler({ ...reactionObj, isActive: !reactionObj.isActive })
                  toggleActivePopup(false)
                }}
              />
            )
          })}
        </Styled.ReactionsPanel>
      )}
    </Styled.ReactionPanelOpener>
  )
}

export default ReactionPanelOpener
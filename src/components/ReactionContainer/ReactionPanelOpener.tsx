import { Icon } from "@ynput/ayon-react-components"
import * as Styled from './Reactions.styled'
import { reactionMapping } from "./helpers"
import { Reaction as ReactionType } from "./types"
import Reaction from "./Reaction"
import { useState } from "react"

type Props = {
  reactions: ReactionType[]
  changeHandler: (reaction: ReactionType) => void
}

const ReactionPanelOpener = ({
  reactions,
  changeHandler,
}: Props) => {
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const activeReactions = reactions
    .filter((reaction) => reaction.isActive)
    .map((reaction) => reaction.type)

  return (
    <Styled.ReactionPanelOpener>
      <Icon
        icon="add_reaction"
        className="add-reaction"
        onClick={() => setIsPopupOpen(!isPopupOpen)}
      />
      {isPopupOpen && (
        <>
          <Styled.Overlay onClick={() => setIsPopupOpen(false)} />

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
                    setIsPopupOpen(false)
                  }}
                />
              )
            })}
          </Styled.ReactionsPanel>
        </>
      )}
    </Styled.ReactionPanelOpener>
  )
}

export default ReactionPanelOpener
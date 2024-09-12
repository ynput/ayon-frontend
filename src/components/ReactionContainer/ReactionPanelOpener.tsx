import { useState } from "react"
import { Icon } from "@ynput/ayon-react-components"
import * as Styled from './ReactionStyles.styled'
import { reactionMapping } from "./helpers"
import { Reaction as ReactionType } from "./types"
import Reaction from "./Reaction"

type Props = {
  reactions: ReactionType[]
  changeHandler: (reaction: ReactionType) => void
}

const ReactionPanelOpener = ({reactions, changeHandler}: Props) => {
  const [isOpen, setIsOpen] =  useState(false)

  const activeReactions = reactions
    .filter((reaction) => reaction.isActive)
    .map((reaction) => reaction.type)

  return (
    <Styled.ReactionPanelOpener>
      <Icon
        icon="add_reaction"
        className="add-reaction"
        onClick={() => setIsOpen((prev) => !prev)}
      />
      {isOpen && (
        <Styled.ReactionsPanel>
          {reactionMapping.map((reaction) => {
            const reactionObj = {
              type: reaction.key,
              isActive: activeReactions.includes(reaction.key),
            }
            return (
              <Reaction
                reaction={reactionObj}
                variant="compact"
                onClick={() => {
                  changeHandler({ ...reactionObj, isActive: !reactionObj.isActive })
                  setIsOpen(false)
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
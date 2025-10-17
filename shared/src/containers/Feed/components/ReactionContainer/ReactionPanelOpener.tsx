import { Icon } from '@ynput/ayon-react-components'
import * as Styled from './Reactions.styled'
import { reactionMapping } from './helpers'
import { Reaction as ReactionType } from './types'
import Reaction from './Reaction'
import { useState } from 'react'

type Props = {
  reactions: ReactionType[]
  changeHandler: (reaction: ReactionType) => void
  categoryPrimary?: string
  categorySecondary?: string
  categoryTertiary?: string
}

const ReactionPanelOpener = ({
  reactions,
  changeHandler,
  categoryPrimary,
  categorySecondary,
  categoryTertiary,
}: Props) => {
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const activeReactions = reactions
    .filter((reaction) => reaction.isActive)
    .map((reaction) => reaction.type)

  return (
    <Styled.ReactionPanelOpener
      $categoryPrimary={categoryPrimary}
      $categorySecondary={categorySecondary}
      $categoryTertiary={categoryTertiary}
    >
      <Icon
        icon="add_reaction"
        className="add-reaction"
        onClick={() => setIsPopupOpen(!isPopupOpen)}
      />
      {isPopupOpen && (
        <>
          <Styled.Overlay onClick={() => setIsPopupOpen(false)} />

          <Styled.ReactionsPanel
            $categoryPrimary={categoryPrimary}
            $categorySecondary={categorySecondary}
            $categoryTertiary={categoryTertiary}
          >
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
                  categoryPrimary={categoryPrimary}
                  categorySecondary={categorySecondary}
                  categoryTertiary={categoryTertiary}
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

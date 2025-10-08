import ExistingReactions from './ExistingReactions'
import ReactionPanelOpener from './ReactionPanelOpener'
import * as Styled from './Reactions.styled'
import { Reaction } from './types'

type Props = {
  reactions: Reaction[]
  changeHandler: (reaction: Reaction) => void
  readOnly?: boolean
  categoryPrimary?: string
  categorySecondary?: string
  categoryTertiary?: string
}

const Reactions = ({
  reactions,
  changeHandler,
  readOnly,
  categoryPrimary,
  categorySecondary,
  categoryTertiary,
}: Props) => {
  return (
    <Styled.ReactionsWrapper
      $categoryPrimary={categoryPrimary}
      $categorySecondary={categorySecondary}
      $categoryTertiary={categoryTertiary}
    >
      {!readOnly && (
        <ReactionPanelOpener
          reactions={reactions}
          changeHandler={changeHandler}
          categoryPrimary={categoryPrimary}
          categorySecondary={categorySecondary}
          categoryTertiary={categoryTertiary}
        />
      )}
      <ExistingReactions
        reactions={reactions}
        changeHandler={changeHandler}
        categoryPrimary={categoryPrimary}
        categorySecondary={categorySecondary}
        categoryTertiary={categoryTertiary}
      />
    </Styled.ReactionsWrapper>
  )
}

export default Reactions

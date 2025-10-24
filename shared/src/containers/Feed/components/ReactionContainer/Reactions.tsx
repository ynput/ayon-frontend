import clsx from 'clsx'
import ExistingReactions from './ExistingReactions'
import ReactionPanelOpener from './ReactionPanelOpener'
import * as Styled from './Reactions.styled'
import { Reaction } from './types'

type Props = {
  reactions: Reaction[]
  changeHandler: (reaction: Reaction) => void
  readOnly?: boolean
  category?: string
  categoryPrimary?: string
  categorySecondary?: string
  categoryTertiary?: string
}

const Reactions = ({
  reactions,
  changeHandler,
  readOnly,
  category,
  categoryPrimary,
  categorySecondary,
  categoryTertiary,
}: Props) => {
  // show category colors if category is set (set category and not a guest user)
  const categoryColors = category ? { categoryPrimary, categorySecondary, categoryTertiary } : {}
  return (
    <Styled.ReactionsWrapper>
      {!readOnly && (
        <ReactionPanelOpener
          reactions={reactions}
          changeHandler={changeHandler}
          {...categoryColors}
        />
      )}
      <ExistingReactions reactions={reactions} changeHandler={changeHandler} {...categoryColors} />
    </Styled.ReactionsWrapper>
  )
}

export default Reactions

import * as Styled from './InboxCategoryDots.styled'
import type { ActivityCategory } from '@shared/api'

interface InboxCategoryDotsProps {
  categories: ActivityCategory[]
}

const InboxCategoryDots = ({ categories }: InboxCategoryDotsProps) => {
  if (!categories.length) return null

  return (
    <Styled.Dots
      className="categories"
      role="img"
      aria-label={categories.map((category) => category.name).join(', ')}
    >
      {categories.map((category) => (
        <Styled.Dot
          key={category.name}
          style={{ backgroundColor: category.color }}
          data-tooltip={category.name}
        />
      ))}
    </Styled.Dots>
  )
}

export default InboxCategoryDots

import styled from 'styled-components'
import type { ActivityCategory } from '@shared/api'

const Dots = styled.span`
  display: flex;
  align-items: center;

  /* stacked like the user avatars */
  & > * + * {
    margin-left: -3px;
  }
`

const Dot = styled.span`
  width: 8px;
  height: 8px;
  min-width: 8px;
  border-radius: 50%;
  /* ring in the row colour keeps overlapping dots apart */
  box-shadow: 0 0 0 1px var(--md-sys-color-surface-container-low);
`

interface InboxCategoryDotsProps {
  categories: ActivityCategory[]
}

const InboxCategoryDots = ({ categories }: InboxCategoryDotsProps) => {
  if (!categories.length) return null

  return (
    <Dots
      className="categories"
      role="img"
      aria-label={categories.map((category) => category.name).join(', ')}
    >
      {categories.map((category) => (
        <Dot
          key={category.name}
          style={{ backgroundColor: category.color }}
          data-tooltip={category.name}
        />
      ))}
    </Dots>
  )
}

export default InboxCategoryDots

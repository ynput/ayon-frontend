import styled from 'styled-components'
import { useGetActivityCategoriesQuery } from '@shared/api'

const Dots = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
`

const Dot = styled.span`
  width: 8px;
  height: 8px;
  min-width: 8px;
  border-radius: 50%;
`

interface InboxCategoryDotsProps {
  projectName?: string
  categories: string[]
}

const InboxCategoryDots = ({ projectName, categories }: InboxCategoryDotsProps) => {
  // rendered only for rows that carry a category, so nothing is fetched for a plain inbox
  const { data: projectCategories = [] } = useGetActivityCategoriesQuery(
    { projectName: projectName as string },
    { skip: !projectName },
  )

  const known = categories
    .map((name) => projectCategories.find((category) => category.name === name))
    .filter((category): category is (typeof projectCategories)[number] => !!category)

  if (!known.length) return null

  return (
    <Dots
      className="categories"
      role="img"
      aria-label={known.map((category) => category.name).join(', ')}
    >
      {known.map((category) => (
        <Dot key={category.name} style={{ backgroundColor: category.color }} data-tooltip={category.name} />
      ))}
    </Dots>
  )
}

export default InboxCategoryDots

import * as Styled from './Feed.styled'

export const getNextPage = ({ activities }) => {
  const lastActivity = activities[activities.length - 1]
  // get cursor of last activity
  let cursor = lastActivity?.cursor
  // get hasPreviousPage of last activity
  let hasPreviousPage = lastActivity?.hasPreviousPage
  if (lastActivity?.activityType === 'group') {
    const lastGroupActivity = lastActivity.items[lastActivity.items.length - 1]
    cursor = lastGroupActivity?.cursor
    hasPreviousPage = lastGroupActivity?.hasPreviousPage
  }

  return { cursor, hasPreviousPage }
}

const getRandomNumberBetween = (min = 50, max = 200) => {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

export const getLoadingPlaceholders = (amount) =>
  new Array(amount)
    .fill(0)
    .map((_, index) => (
      <Styled.Placeholder key={index} style={{ minHeight: getRandomNumberBetween(50, 150) }} />
    ))

import * as Styled from './Feed.styled'

const getRandomNumberBetween = (min = 50, max = 200) => {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

export const getLoadingPlaceholders = (amount) =>
  new Array(amount)
    .fill(0)
    .map((_, index) => (
      <Styled.Placeholder
        key={index}
        className="loading"
        style={{ minHeight: getRandomNumberBetween(50, 150) }}
      />
    ))

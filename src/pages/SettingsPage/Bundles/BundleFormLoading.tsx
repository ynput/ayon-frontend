import { FC } from 'react'
import styled from 'styled-components'

const Container = styled.div`
  padding-top: 40px;
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-large);
  height: 100%;

  span {
    width: 100%;
    min-height: 32px;
    border-radius: var(--border-radius);
  }

  /* last span grows to fill space */
  .body {
    display: flex;
    gap: var(--base-gap-large);
    flex-grow: 1;
  }
`

const BundleFormLoading: FC = () => {
  const shimmer = <span className="loading shimmer-dark"></span>

  return (
    <Container>
      {shimmer}
      {shimmer}
      {shimmer}
      <div className="body">
        {shimmer}
        {shimmer}
      </div>
    </Container>
  )
}

export default BundleFormLoading

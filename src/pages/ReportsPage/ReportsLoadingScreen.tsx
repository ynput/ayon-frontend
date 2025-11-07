import { FC } from 'react'
import styled from 'styled-components'

interface ReportsLoadingScreenProps {}

const Container = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
  gap: 0;
  padding: var(--padding-l);
`

const Sidebar = styled.div`
  width: 15%;
  min-width: 2%;
  max-width: 600px;
  height: 100%;
  background: #f0f0f0;
  flex-shrink: 0;
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 1rem;
  flex: 1;
  padding: 1rem;
  overflow: auto;
`

const GridItem = styled.div`
  background: #f0f0f0;
  border-radius: 4px;
  min-height: 200px;
`

const ReportsLoadingScreen: FC<ReportsLoadingScreenProps> = () => {
  return (
    <Container>
      {/* Left sidebar */}
      <Sidebar className="loading"></Sidebar>

      {/* 3x3 Grid */}
      <Grid>
        {Array.from({ length: 9 }).map((_, index) => (
          <GridItem key={index} className="loading"></GridItem>
        ))}
      </Grid>
    </Container>
  )
}

export default ReportsLoadingScreen

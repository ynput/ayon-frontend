import { FC, HTMLAttributes } from 'react'
import styled from 'styled-components'

interface GridConfig {
  columns: number
  rows: number
  gap?: string
  itemMinHeight?: string
}

interface SidebarConfig {
  width?: string
  minWidth?: string
  maxWidth?: string
}

export interface ReportsLoadingScreenProps extends HTMLAttributes<HTMLDivElement> {
  showSidebar?: boolean
  sidebarConfig?: SidebarConfig
  gridConfig?: GridConfig
  padding?: string
  pt?: {
    sidebar?: Partial<HTMLAttributes<HTMLDivElement>>
    grid?: Partial<HTMLAttributes<HTMLDivElement>>
    gridItem?: Partial<HTMLAttributes<HTMLDivElement>>
  }
}

const Container = styled.div<{ $padding: string }>`
  display: flex;
  width: 100%;
  height: 100%;
  gap: 0;
  padding: ${(props) => props.$padding};
`

const Sidebar = styled.div<{ $config: SidebarConfig }>`
  width: ${(props) => props.$config.width || '15%'};
  min-width: ${(props) => props.$config.minWidth || '2%'};
  max-width: ${(props) => props.$config.maxWidth || '600px'};
  height: 100%;
  flex-shrink: 0;
  border-radius: 4px;
  background-color: var(--md-sys-color-surface-container);
`

const Grid = styled.div<{ $config: GridConfig }>`
  display: grid;
  grid-template-columns: repeat(${(props) => props.$config.columns}, 1fr);
  grid-template-rows: repeat(${(props) => props.$config.rows}, 1fr);
  gap: ${(props) => props.$config.gap || '1rem'};
  flex: 1;
  padding: 1rem;
  overflow: auto;
`

const GridItem = styled.div<{ $minHeight: string }>`
  border-radius: 4px;
  min-height: ${(props) => props.$minHeight};
  background-color: var(--md-sys-color-surface-container);
`

export const AddonLoadingScreen: FC<ReportsLoadingScreenProps> = ({
  showSidebar = true,
  sidebarConfig = {},
  gridConfig = { columns: 3, rows: 3 },
  padding = 'var(--padding-l)',
  pt = {},
  ...containerProps
}) => {
  const totalItems = gridConfig.columns * gridConfig.rows

  return (
    <Container $padding={padding} {...containerProps}>
      {showSidebar && (
        <Sidebar className="loading" $config={sidebarConfig} {...pt?.sidebar}></Sidebar>
      )}

      <Grid $config={gridConfig} {...pt?.grid}>
        {Array.from({ length: totalItems }).map((_, index) => (
          <GridItem
            key={index}
            className="loading"
            $minHeight={gridConfig.itemMinHeight || '200px'}
            {...pt?.gridItem}
          ></GridItem>
        ))}
      </Grid>
    </Container>
  )
}

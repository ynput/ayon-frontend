import styled from 'styled-components'
import React, { ReactNode } from 'react'
import clsx from 'clsx'

const StyledGridLayout = styled.div<{ $minWidth: number }>`
  width: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(${({ $minWidth }) => $minWidth}px, 1fr));
  grid-auto-rows: 1fr;
  gap: 12px;

  @media (max-width: 425px) {
    grid-template-columns: 1fr 1fr;
  }
`

interface GridLayoutProps extends Omit<HTMLDivElement, 'children'> {
  minWidth: number
  ratio: number
  children: ReactNode[]
}

const GridLayout = React.forwardRef<HTMLDivElement, GridLayoutProps>(
  ({ children = [], minWidth = 130, ratio = 1, ...props }, ref) => {
    return (
      <StyledGridLayout {...props} ref={ref} $minWidth={minWidth}>
        {children.map((child, index) => (
          <div
            style={{
              aspectRatio: `${ratio} / 1`,
            }}
            key={index}
            className={clsx('grid-item', child.props.className)}
          >
            {child}
          </div>
        ))}
      </StyledGridLayout>
    )
  },
)

export default GridLayout

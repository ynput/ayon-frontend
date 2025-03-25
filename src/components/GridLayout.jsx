import PropTypes from 'prop-types'
import styled from 'styled-components'
import React from 'react'
import clsx from 'clsx'

const StyledGridLayout = styled.div`
  width: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(${({ $minWidth }) => $minWidth}px, 1fr));
  grid-auto-rows: 1fr;
  gap: 12px;

  @media (max-width: 425px) {
    grid-template-columns: 1fr 1fr;
  }
`

const GridLayout = React.forwardRef(
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

GridLayout.displayName = 'GridLayout'

GridLayout.propTypes = {
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired,
  ratio: PropTypes.number,
  minWidth: PropTypes.number,
}

export default GridLayout

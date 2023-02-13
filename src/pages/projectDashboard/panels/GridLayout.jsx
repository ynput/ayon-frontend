import React from 'react'
import { useDispatch } from 'react-redux'
import styled, { css } from 'styled-components'
import { onShare } from '/src/features/context'
import { toPng } from 'html-to-image'

// styled grid
const GridStyled = styled.div`
  display: grid;
  grid-template-columns: 1fr 0.8fr 1.2fr;
  grid-template-rows: 1fr 1fr;
  gap: 8px;

  /* overflow y */
  overflow-y: clip;
  padding-top: 1px;
  margin-top: -1px;

  /* grid rows */
  ${({ rows }) =>
    rows &&
    rows.map(
      (row, index) => css`
        & > *:nth-child(${index + 1}) {
          grid-row: span ${row};
        }
      `,
    )}
`

const GridLayout = ({ children, projectName }) => {
  const dispatch = useDispatch()

  const handleShareLink = async (name, data, ref) => {
    let img
    if (ref) {
      img = await toPng(ref).catch((err) => console.log(err))
    }

    dispatch(onShare({ name, data, img }))
  }
  // get rows props from children
  const rows = React.Children.map(children, (child) => child.props.rows || 1)

  const childrenWithProps = React.Children.map(children, (child) =>
    React.cloneElement(child, { projectName, share: handleShareLink }),
  )

  return <GridStyled rows={rows}>{childrenWithProps}</GridStyled>
}

export default GridLayout

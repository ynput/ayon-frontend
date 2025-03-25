import React from 'react'
import { useDispatch } from 'react-redux'
import styled from 'styled-components'
import { onShare } from '@state/context'
import { toPng } from 'html-to-image'
import { useRef } from 'react'

// styled grid
const GridStyled = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: var(--base-gap-large);
  height: 100%;
  overflow: hidden;

  /* media max 977px */
  @media (max-width: 977px) {
    overflow: auto;
  }

  /* panels in the grid */
  & > div {
    display: flex;
    flex-direction: column;
    gap: var(--base-gap-large);
    overflow: auto;
    height: 100%;
    padding-bottom: 8px;
  }
`

const DashboardPanelsContainer = ({ children, projectName }) => {
  const dispatch = useDispatch()
  const ref = useRef()

  const handleShareLink = async (name, data, position) => {
    // get ref of child using index
    const childRef = ref.current.children[position[0]]?.children[position[1]]

    const share = { name, data, img: null, link: window.location.href }

    let img
    if (childRef) {
      dispatch(onShare(share))
      // remove overflows
      ref.current.style.overflowY = 'visible'
      childRef.style.minWidth = 'fit-content'
      // hide share icon
      childRef.querySelector('header button').style.opacity = 0
      img = await toPng(childRef).catch((err) => console.log(err))
      // show share icon
      childRef.querySelector('header button').style.opacity = 1
      // restore overflows
      ref.current.style.overflowY = 'clip'
      childRef.style.minWidth = null
      dispatch(onShare({ ...share, img }))
    } else {
      dispatch(onShare(share))
    }
  }

  // separate children into columns
  const columns = []
  React.Children.forEach(children, (child, index) => {
    if (!columns[child.props.column - 1]) columns[child.props.column - 1] = []
    columns[child.props.column - 1].push(
      React.cloneElement(child, {
        projectName,
        share: handleShareLink,
        position: [child.props.column - 1, columns[child.props.column - 1].length],
        key: `${index}-${child.props.column}`,
      }),
    )
  })

  return (
    <GridStyled ref={ref}>
      {columns.map((rows, i) => (
        <div key={i}>{rows.map((child) => child)}</div>
      ))}
    </GridStyled>
  )
}

export default DashboardPanelsContainer

import React from 'react'
import { useGetProjectQuery } from '/src/services/project/getProject'
import DashboardPanelWrapper from './DashboardPanelWrapper'
import Thumbnail from '/src/containers/thumbnail'
import styled, { css } from 'styled-components'
import AttributeTable from '/src/containers/attributeTable'
import { format } from 'date-fns'
import getShimmerStyles from '/src/styles/getShimmerStyles'

const ThumbnailStyled = styled.div`
  width: 100%;
  height: auto;
  aspect-ratio: 16 / 9;
  & > div {
    width: 100%;
    height: 100%;
    max-width: unset;
    aspect-ratio: unset;

    img {
      object-fit: cover;
    }
  }
`

const ActiveStyled = styled.span`
  background-color: var(--color-grey-01);
  padding: 4px;
  border-radius: 3px;
  position: relative;

  ${({ $isActive }) =>
    $isActive &&
    css`
      background-color: var(--md-sys-color-tertiary);
      color: var(--md-sys-color-on-tertiary);
    `}

  ${({ $isLoading }) =>
    $isLoading &&
    css`
      color: transparent;
      background-color: unset;
      width: 100%;

      ${getShimmerStyles()}
    `}
`

const ProjectDetails = ({ projectName }) => {
  const { data = {}, isFetching } = useGetProjectQuery({ projectName })

  const { attrib = {}, active } = data

  const attribArray = []
  for (const key in attrib) {
    let value = attrib[key]

    // if key has "Date" in it, convert to date
    if (key.includes('Date')) {
      value = format(new Date(value), 'dd/MM/yyyy')
    }

    attribArray.push({
      name: key,
      value,
    })
  }

  const activeIcon = (
    <ActiveStyled $isLoading={isFetching} $isActive={active}>
      {active ? 'active' : ' inactive'}
    </ActiveStyled>
  )

  // TODO: projects don't currently have a thumbnail

  return (
    <DashboardPanelWrapper
      title={!isFetching ? projectName : ' '}
      header={activeIcon}
      stylePanel={{ height: 'calc(100% - 8px)', flex: 1, overflow: 'hidden' }}
      style={{ height: '100%', overflow: 'hidden' }}
    >
      <ThumbnailStyled>
        <Thumbnail projectName={projectName} isLoading={isFetching} shimmer />
      </ThumbnailStyled>
      <AttributeTable
        projectAttrib={attribArray}
        style={{
          overflow: 'auto',
        }}
        isLoading={isFetching}
      />
    </DashboardPanelWrapper>
  )
}

export default ProjectDetails

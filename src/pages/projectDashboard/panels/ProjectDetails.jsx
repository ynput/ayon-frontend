import React from 'react'
import { useGetProjectQuery } from '/src/services/project/getProject'
import DashboardPanelWrapper from './DashboardPanelWrapper'
import Thumbnail from '/src/containers/thumbnail'
import styled from 'styled-components'
import AttributeTable from '/src/containers/attributeTable'
import { format } from 'date-fns'

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
`

const ProjectDetails = ({ projectName }) => {
  const { data = {}, isError } = useGetProjectQuery({ projectName })

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
    <ActiveStyled style={{ color: active && 'var(--color-hl-studio)' }}>
      {active ? 'active' : ' inactive'}
    </ActiveStyled>
  )

  return (
    <DashboardPanelWrapper
      title={projectName}
      header={activeIcon}
      stylePanel={{ height: 'calc(100% - 8px)', flex: 1, overflow: 'hidden' }}
      isError={isError}
      style={{ height: '100%', overflow: 'hidden' }}
    >
      <ThumbnailStyled>
        <Thumbnail projectName={projectName} />
      </ThumbnailStyled>
      <AttributeTable
        projectAttrib={attribArray}
        style={{
          overflow: 'auto',
        }}
      />
    </DashboardPanelWrapper>
  )
}

export default ProjectDetails

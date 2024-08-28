import { $Any } from '@/types'
import { FC } from 'react'
import styled from 'styled-components'
import RepresentationsList from '@containers/RepresentationsList/RepresentationsList'
import ReviewablesList from '@/containers/ReviewablesList'

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;

  height: 100%;
  overflow: hidden;
`

const StyledSection = styled.div`
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-small);
  overflow: hidden;

  padding: var(--padding-m);
  overflow: auto;

  &:first-child {
    border-bottom: 1px solid var(--md-sys-color-outline-variant);
  }
`

interface DetailsPanelFilesProps {
  entities: $Any[]
  scope: string
  isLoadingVersion: boolean
}

const DetailsPanelFiles: FC<DetailsPanelFilesProps> = ({
  entities = [],
  scope,
  isLoadingVersion,
}) => {
  const firstVersion = entities[0]

  if (!firstVersion) return null

  let reviewablesTitle = 'Reviewables'
  if (entities.length > 1) reviewablesTitle += ` (${firstVersion.title})`

  return (
    <StyledContainer>
      <StyledSection>
        <h4>{reviewablesTitle}</h4>
        <ReviewablesList
          projectName={firstVersion.projectName}
          productId={firstVersion.productId}
          versionId={firstVersion.id}
          isLoadingVersion={isLoadingVersion}
          scope={scope}
        />
      </StyledSection>
      <StyledSection>
        <h4>Representations</h4>
        <RepresentationsList entities={entities} />
      </StyledSection>
    </StyledContainer>
  )
}

export default DetailsPanelFiles

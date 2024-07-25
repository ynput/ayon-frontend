import { FC, Fragment } from 'react'
import * as Styled from './EntityPath.styled'

export type PathSegment = {
  type: 'folder' | 'task' | 'product' | 'version'
  label: string
  id: string
}

interface EntityPathProps {
  projectName: string
  segments: PathSegment[]
}

const EntityPath: FC<EntityPathProps> = ({ projectName, segments }) => {
  const lastFolder = segments.filter((segment) => segment.type === 'folder').pop()
  const parentFolders = segments.filter((segment) => segment.type === 'folder').slice(0, -1)

  const segmentsToShow = segments.filter((segment) => segment.type !== 'folder')
  if (lastFolder) segmentsToShow.unshift(lastFolder)

  return (
    <Styled.Path>
      <Styled.Segment>{projectName}</Styled.Segment>

      {!!parentFolders.length && (
        <>
          /<Styled.Segment>...</Styled.Segment>
        </>
      )}

      {segmentsToShow.map((entity) => (
        <Fragment key={entity.id}>
          /<Styled.Segment key={entity.id}>{entity.label}</Styled.Segment>
        </Fragment>
      ))}
    </Styled.Path>
  )
}

export default EntityPath

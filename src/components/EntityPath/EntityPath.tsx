import { FC, Fragment } from 'react'
import * as Styled from './EntityPath.styled'
import { classNames } from 'primereact/utils'

export type PathSegment = {
  type: 'folder' | 'task' | 'product' | 'version'
  label: string
  id: string
}

interface EntityPathProps {
  projectName: string
  segments: PathSegment[]
  isLoading: boolean
}

const EntityPath: FC<EntityPathProps> = ({ projectName, segments, isLoading }) => {
  const lastFolder = segments.filter((segment) => segment.type === 'folder').pop()
  const parentFolders = segments.filter((segment) => segment.type === 'folder').slice(0, -1)

  const segmentsToShow = segments.filter((segment) => segment.type !== 'folder')
  if (lastFolder) segmentsToShow.unshift(lastFolder)

  return (
    <Styled.Path className={classNames({ loading: isLoading })}>
      <Styled.Segment>{projectName}</Styled.Segment>

      {!!parentFolders.length && (
        <>
          <span>/</span>
          <Styled.Segment>...</Styled.Segment>
        </>
      )}

      {segmentsToShow.map((entity) => (
        <Fragment key={entity.id}>
          <span>/</span>
          <Styled.Segment key={entity.id}>{entity.label}</Styled.Segment>
        </Fragment>
      ))}
    </Styled.Path>
  )
}

export default EntityPath

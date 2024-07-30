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
  // Check if there are fewer than or equal to 3 segments
  const segmentsToShow = segments.length <= 3 ? segments : segments.slice(-3)
  const hiddenSegments = segments.length <= 3 ? [] : segments.slice(0, -3)

  return (
    <Styled.Path className={classNames({ loading: isLoading })}>
      <Styled.Segment>{projectName}</Styled.Segment>

      {!!hiddenSegments.length && (
        <>
          <span>/</span>
          <Styled.Segment>...</Styled.Segment>
        </>
      )}

      {segmentsToShow.map((segment) => (
        <Fragment key={segment.id}>
          <span>/</span>
          <Styled.Segment key={segment.id}>{segment.label}</Styled.Segment>
        </Fragment>
      ))}
    </Styled.Path>
  )
}

export default EntityPath

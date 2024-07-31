import { FC, Fragment, useRef, useState } from 'react'
import * as Styled from './EntityPath.styled'
import { classNames } from 'primereact/utils'
import { SegmentWrapper } from './SegmentWrapper'
import { Icon } from '@ynput/ayon-react-components'

export type PathSegment = {
  type: 'folder' | 'task' | 'product' | 'version'
  label: string
  id: string
}

interface EntityPathProps {
  projectName: string
  segments: PathSegment[]
  isLoading: boolean
  entityType: 'folder' | 'task' | 'version'
}

const EntityPath: FC<EntityPathProps> = ({ projectName, segments, isLoading, entityType }) => {
  const moreRef = useRef<HTMLSpanElement>(null)
  const [moreHover, setMoreHover] = useState(false)

  // Check if there are fewer than or equal to 3 segments
  const segmentsToShow = segments.length <= 3 ? segments : segments.slice(-3)
  const hiddenSegments = segments.length <= 3 ? [] : segments.slice(0, -3)

  return (
    <Styled.Path className={classNames({ loading: isLoading })} id="entity-path">
      <SegmentWrapper>
        <Styled.Segment>{projectName}</Styled.Segment>
      </SegmentWrapper>

      {!!hiddenSegments.length && (
        <>
          <span>/</span>
          <Styled.Segment
            className="more"
            ref={moreRef}
            onMouseOver={() => setMoreHover(true)}
            onMouseOut={() => setMoreHover(false)}
          >
            ...
            {moreHover && (
              <Styled.MoreModal>
                <Styled.MoreList>
                  {hiddenSegments.map((segment) => (
                    <Styled.MoreItem key={segment.id}>{segment.label}</Styled.MoreItem>
                  ))}
                </Styled.MoreList>
              </Styled.MoreModal>
            )}
          </Styled.Segment>
        </>
      )}

      {segmentsToShow.map((segment) => (
        <Fragment key={segment.id}>
          <span>/</span>
          <SegmentWrapper segment={segment}>
            <Styled.Segment key={segment.id}>
              <span className="label">{segment.label}</span>
              {segment?.type === 'version' && <Icon icon="expand_more" />}
            </Styled.Segment>
          </SegmentWrapper>
        </Fragment>
      ))}
    </Styled.Path>
  )
}

export default EntityPath

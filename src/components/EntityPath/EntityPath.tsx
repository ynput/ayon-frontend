import { FC, Fragment, MouseEvent, useState } from 'react'
import * as Styled from './EntityPath.styled'
import { classNames } from 'primereact/utils'
import SegmentProvider from './SegmentProvider'
import { Icon } from '@ynput/ayon-react-components'

export type PathSegment = {
  type: string
  label: string
  id: string
}

const dropdownStates = ['more', 'versions']
type DropdownState = (typeof dropdownStates)[number]

type DropdownMouseEvent = MouseEvent<HTMLSpanElement>
const getDropdownElements = (e: DropdownMouseEvent): [HTMLElement, string] => {
  const target = e.target as HTMLElement
  const dropdownId = target.closest('.dropdown')?.id || ''
  return [target, dropdownId]
}

interface EntityPathProps {
  projectName: string
  segments: PathSegment[]
  isLoading: boolean
  entityType: string
  versions: PathSegment[]
}

const EntityPath: FC<EntityPathProps> = ({
  projectName,
  segments,
  versions = [],
  isLoading,
  entityType,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState<null | DropdownState>(null)

  // Check if there are fewer than or equal to 3 segments
  const segmentsToShow = segments.length <= 3 ? segments : segments.slice(-3)
  const hiddenSegments = segments.length <= 3 ? [] : segments.slice(0, -3)

  // if the entityType is a version, separate the version
  let versionSegment
  let finalSegmentsToShow = segmentsToShow

  if (entityType === 'version' && segments.length > 0) {
    versionSegment = segments[segments.length - 1]
    finalSegmentsToShow = segmentsToShow.slice(0, -1)
  }

  const handleMouseEnter = (e: DropdownMouseEvent) => {
    const [, id] = getDropdownElements(e)
    if (id && !dropdownOpen) setDropdownOpen(id)
  }
  const handleMouseLeave = () => setDropdownOpen(null)

  const handleDropdownClick = (e: DropdownMouseEvent) => {
    const [target, id] = getDropdownElements(e)

    if (!dropdownStates.includes(id)) return
    const isListItem = !!target.closest('li')

    if (isListItem) setDropdownOpen(null)
    else if (dropdownOpen !== id) setDropdownOpen(id)
  }

  return (
    <Styled.Path className={classNames({ loading: isLoading })} id="entity-path">
      <SegmentProvider>
        <Styled.Segment>{projectName}</Styled.Segment>
      </SegmentProvider>

      {!!hiddenSegments.length && (
        <>
          <span>/</span>
          <Styled.Segment
            className="dropdown more"
            id="more"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={handleDropdownClick}
          >
            ...
            {dropdownOpen === 'more' && (
              <Styled.MoreModal>
                <Styled.MoreList>
                  {hiddenSegments.map((segment) => (
                    <SegmentProvider segment={segment} key={segment.id}>
                      <Styled.MoreItem>{segment.label}</Styled.MoreItem>
                    </SegmentProvider>
                  ))}
                </Styled.MoreList>
              </Styled.MoreModal>
            )}
          </Styled.Segment>
        </>
      )}

      {finalSegmentsToShow.map((segment) => (
        <Fragment key={segment.id}>
          <span>/</span>

          <SegmentProvider segment={segment}>
            <Styled.Segment>
              <span className="label">{segment.label}</span>
            </Styled.Segment>
          </SegmentProvider>
        </Fragment>
      ))}

      {versionSegment && (
        <>
          <span>/</span>
          <Styled.SegmentWrapper
            className="dropdown"
            id="versions"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={handleDropdownClick}
          >
            <SegmentProvider segment={versionSegment} isOpen={dropdownOpen === 'versions'}>
              <Styled.Segment>
                <span className="label">{versionSegment.label}</span>
                <Icon icon="expand_more" />
              </Styled.Segment>
            </SegmentProvider>
            {dropdownOpen === 'versions' && (
              <Styled.MoreModal>
                <Styled.MoreList>
                  {versions.map((version) => (
                    <SegmentProvider segment={version} key={version.id}>
                      <Styled.MoreItem>{version.label}</Styled.MoreItem>
                    </SegmentProvider>
                  ))}
                </Styled.MoreList>
              </Styled.MoreModal>
            )}
          </Styled.SegmentWrapper>
        </>
      )}
    </Styled.Path>
  )
}

export default EntityPath

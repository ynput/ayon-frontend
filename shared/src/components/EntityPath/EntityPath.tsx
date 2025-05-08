import { FC, Fragment, MouseEvent, useLayoutEffect, useRef, useState } from 'react'
import * as Styled from './EntityPath.styled'
import clsx from 'clsx'
import SegmentProvider from './SegmentProvider'
import { Icon } from '@ynput/ayon-react-components'
import { DetailsPanelEntityType } from '@shared/api'

const Slash = () => <span className="slash">/</span>

export type PathSegment = {
  type: DetailsPanelEntityType | 'product' | 'project'
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

export interface EntityPathProps {
  projectName: string
  hideProjectName: boolean
  segments: PathSegment[]
  isLoading: boolean
  entityType: string
  versions: PathSegment[]
  scope: string
}

export const EntityPath: FC<EntityPathProps> = ({
  projectName,
  hideProjectName,
  segments,
  versions = [],
  isLoading,
  entityType,
  scope,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dropdownOpen, setDropdownOpen] = useState<null | DropdownState>(null)
  // defaults to whole path
  const [maxSegments, setMaxSegments] = useState<null | number>(null)
  const [calcMaxWidth, setCalcMaxWidth] = useState(false)

  useLayoutEffect(() => {
    setMaxSegments(null)
    setCalcMaxWidth(true)
  }, [segments])

  useLayoutEffect(() => {
    if (!containerRef.current) {
      setCalcMaxWidth(false)
      return
    }
    // find max width the path can be
    const container = containerRef.current
    const pathWidth = container.clientWidth
    const maxWidth = getPathMaxWidth(container)

    if (!maxWidth) return

    // we need to reduce the number of segments shown
    // but maybe even then it is still longer than the max width
    // so we need to reduce the number of segments until the total width is less than the max width
    const children = container.children
    let totalWidth = pathWidth
    // number of segments to keep
    const fullCount = container.childElementCount
    let segmentsCount = fullCount
    // while loop that removes segments until the total width is less than the max width
    while (totalWidth > maxWidth && segmentsCount > 0) {
      // remove 2 segments at a time (because of slashes)
      segmentsCount -= 2
      totalWidth = totalUpSegmentsWidth(children, segmentsCount, fullCount)
    }

    // count number of "full" segments left
    // if something goes wrong, removing 1 (2) is probably enough
    let newMaxSegments =
      Array.from(children)
        .slice(0, segmentsCount)
        .filter(
          (segment) => segment.nodeType === Node.ELEMENT_NODE && segment.className.includes('full'),
        )?.length || 2

    // cap at 1
    newMaxSegments = Math.max(newMaxSegments, 1)

    setMaxSegments(newMaxSegments)
    setCalcMaxWidth(false)
  }, [containerRef.current, calcMaxWidth])

  // Check if there are fewer than or equal to maxSegments segments
  const segmentsToShow =
    maxSegments && segments.length > maxSegments ? segments.slice(-maxSegments) : segments
  const hiddenSegments =
    maxSegments && segments.length > maxSegments ? segments.slice(0, -maxSegments) : []

  // if there is no project name, add to hidden segments
  if (hideProjectName)
    hiddenSegments.unshift({ type: 'project', label: projectName, id: projectName })

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

  const segmentProps = { scope, projectName }

  return (
    <Styled.Path className={clsx({ loading: isLoading })} id="entity-path" ref={containerRef}>
      {!hideProjectName && <Styled.Segment>{projectName}</Styled.Segment>}

      {!!hiddenSegments.length && (
        <>
          {!hideProjectName && <Slash />}
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
                    <SegmentProvider {...segmentProps} segment={segment} key={segment.id}>
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
          <Slash />

          <SegmentProvider {...segmentProps} segment={segment} className="full">
            <Styled.Segment>
              <span className="label">{segment.label}</span>
            </Styled.Segment>
          </SegmentProvider>
        </Fragment>
      ))}

      {versionSegment && (
        <>
          <Slash />
          <Styled.SegmentWrapper
            className="full dropdown"
            id="versions"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={handleDropdownClick}
          >
            <SegmentProvider
              {...segmentProps}
              segment={versionSegment}
              isOpen={dropdownOpen === 'versions'}
            >
              <Styled.Segment>
                <Styled.FinalSegmentLabel className="label">
                  {versionSegment.label}
                </Styled.FinalSegmentLabel>
                <Icon icon="expand_more" />
              </Styled.Segment>
            </SegmentProvider>
            {dropdownOpen === 'versions' && (
              <Styled.MoreModal>
                <Styled.MoreList>
                  {versions.map((version) => (
                    <SegmentProvider {...segmentProps} segment={version} key={version.id}>
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

const getPathMaxWidth = (pathEl: HTMLDivElement) => {
  const toolbar = pathEl.parentElement
  if (!toolbar) return
  // get width of toolbar without padding
  const toolbarStyle = getComputedStyle(toolbar)
  const paddingLeft = parseInt(toolbarStyle.paddingLeft) || 0
  const paddingRight = parseInt(toolbarStyle.paddingRight) || 0
  const gap = parseInt(toolbarStyle.gap) || 0
  const toolbarWidth = toolbar.clientWidth - paddingLeft - paddingRight

  // get child elements that are not path
  const children = Array.from(toolbar.children).filter((child) => child.id !== 'entity-path')
  // find total width of children including the gap between them
  const childrenWidth = Array.from(children).reduce(
    (acc, child) => acc + (child as HTMLElement).clientWidth,
    0,
  )

  return toolbarWidth - childrenWidth - gap * (children.length - 1)
}

const totalUpSegmentsWidth = (children: HTMLCollection, count: number, full: number) => {
  const skip = full - count
  let total = 0
  for (let i = 0; i < full - skip; i++) {
    const index = i > 1 ? i + skip : i
    const width = (children[index] as Element)?.clientWidth
    if (isNaN(width)) continue
    total += width
  }
  const gap = 4
  const moreWidth = 40
  return total + (gap * count - 1) + moreWidth
}

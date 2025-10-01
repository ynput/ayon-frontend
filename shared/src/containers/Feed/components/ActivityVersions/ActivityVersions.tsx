import React, { useState } from 'react'
import { Icon } from '@ynput/ayon-react-components'
import ActivityHeader from '../ActivityHeader/ActivityHeader'
import * as Styled from './ActivityVersions.styled'
import { More } from '../ActivityGroup/ActivityGroup.styled'
import ActivityDate from '../ActivityDate'
import { useDetailsPanelContext } from '@shared/context'

interface Version {
  name: string
  id: string
  productId: string
  productName: string
  updatedAt: string
  comment?: string
}

interface ActivityVersionsProps {
  activity: {
    authorName?: string
    authorFullName?: string
    createdAt?: string
    versions?: Version[]
    [key: string]: any
  }
  projectName: string
  entityType?: string
  onReferenceClick?: (ref: any) => void
  filter?: string
}

const ActivityVersions: React.FC<ActivityVersionsProps> = ({
  activity,
  projectName,
  entityType,
  onReferenceClick,
  filter,
}) => {
  const { onOpenViewer } = useDetailsPanelContext()
  let { authorName, authorFullName, createdAt, versions = [] } = activity

  const [showAll, setShowAll] = useState(filter === 'versions')
  const limit = 2

  const [thumbnailError, setThumbnailError] = useState(false)

  const handleClick = (versionId: string, productId: string) =>
    onOpenViewer?.({ versionIds: [versionId], productId, projectName })

  return (
    <Styled.Container>
      <ActivityHeader
        name={authorName}
        fullName={authorFullName || authorName}
        date={createdAt}
        activity={activity}
        projectName={projectName}
        entityType={entityType}
        onReferenceClick={onReferenceClick}
      />
      {versions.flatMap((version, index) => {
        const { name, id, productId, productName, updatedAt, comment } = version
        return (
          (index < limit || showAll) && (
            <Styled.Card onClick={() => handleClick(id, productId)} key={id}>
              <Styled.Content>
                <div>
                  <Styled.Title>
                    <span>{productName}</span>
                    <ActivityDate date={createdAt} isExact />
                  </Styled.Title>
                  <Styled.VersionName className="version">{name}</Styled.VersionName>
                </div>
                <Styled.Thumbnail
                  {...{ projectName }}
                  entityId={id}
                  entityType="version"
                  onError={() => setThumbnailError(true)}
                  iconOnly={thumbnailError}
                  entityUpdatedAt={updatedAt}
                  icon={'play_circle'}
                />
              </Styled.Content>
              {comment && <Styled.Comment>{comment}</Styled.Comment>}
            </Styled.Card>
          )
        )
      })}
      {filter !== 'versions' && versions.length > limit && (
        <More onClick={() => setShowAll(!showAll)}>
          <Icon icon="more" />
          <span>{showAll ? `Show less` : `Show ${versions.length - limit} more versions`}</span>
        </More>
      )}
    </Styled.Container>
  )
}

export default ActivityVersions

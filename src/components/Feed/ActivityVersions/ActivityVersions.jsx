import { Icon } from '@ynput/ayon-react-components'
import ActivityHeader from '../ActivityHeader/ActivityHeader'
import * as Styled from './ActivityVersions.styled'
import { useState } from 'react'
import { More } from '../ActivityGroup/ActivityGroup.styled'
import ActivityDate from '../ActivityDate'
import { useDispatch } from 'react-redux'
import { openViewer } from '@state/viewer'

const ActivityVersions = ({
  activity,
  projectInfo,
  projectName,
  entityType,
  onReferenceClick,
  filter,
}) => {
  let { authorName, authorFullName, createdAt, versions = [] } = activity

  const [showAll, setShowAll] = useState(filter === 'publishes')
  const limit = 2

  const [thumbnailError, setThumbnailError] = useState(false)

  const dispatch = useDispatch()
  const handleClick = (versionId, productId) =>
    dispatch(openViewer({ versionIds: [versionId], productId, projectName }))

  return (
    <Styled.Container>
      <ActivityHeader
        name={authorName}
        fullName={authorFullName || authorName}
        date={createdAt}
        activity={activity}
        projectInfo={projectInfo}
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
                  <span className="version">{name}</span>
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
      {filter !== 'publishes' && versions.length > limit && (
        <More onClick={() => setShowAll(!showAll)}>
          <Icon name="more" />
          <span>{showAll ? `Show less` : `Show ${versions.length - limit} more versions`}</span>
        </More>
      )}
    </Styled.Container>
  )
}

export default ActivityVersions

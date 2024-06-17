import { Icon } from '@ynput/ayon-react-components'
import ActivityHeader from '../ActivityHeader/ActivityHeader'
import * as Styled from './ActivityVersions.styled'
import { productTypes } from '@/features/project'
import { useState } from 'react'
import { More } from '../ActivityGroup/ActivityGroup.styled'
import ActivityDate from '../ActivityDate'

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
      {versions.flatMap(
        ({ name, id, productName, productType, updatedAt, createdAt }, index) =>
          (index < limit || showAll) && (
            <Styled.Card
              key={id}
              onClick={() => onReferenceClick({ entityType: 'version', entityId: id, projectName })}
            >
              <Styled.Content>
                <Styled.Title>
                  <span>{productName}</span>
                  <ActivityDate date={createdAt} isExact />
                </Styled.Title>
                <span className="version">{name}</span>
              </Styled.Content>
              <Styled.Thumbnail
                {...{ projectName }}
                entityId={id}
                entityType="version"
                onError={() => setThumbnailError(true)}
                iconOnly={thumbnailError}
                entityUpdatedAt={updatedAt}
                icon={productTypes[productType]?.icon || 'home_repair_service'}
              />
            </Styled.Card>
          ),
      )}
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

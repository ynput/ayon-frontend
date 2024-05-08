import ActivityHeader from '../ActivityHeader/ActivityHeader'
import * as Styled from './ActivityVersions.styled'
import { productTypes } from '/src/features/project'
import { useState } from 'react'

const ActivityVersions = ({ activity, projectInfo, projectName, entityType, onReferenceClick }) => {
  let {
    authorName,
    authorFullName,
    createdAt,
    updatedAt,
    activityData = {},
    origin = {},
  } = activity

  // v00x
  const { name: versionName } = origin
  // get product name and type
  const { context = {} } = activityData
  const { productName, productType } = context

  const icon = productTypes[productType]?.icon || 'home_repair_service'

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
      <Styled.Card
        onClick={() => onReferenceClick({ entityType: 'version', entityId, projectName })}
      >
        <Styled.Content>
          <Styled.Title>{productName}</Styled.Title>
          <span className="version">{versionName}</span>
        </Styled.Content>
        <Styled.Thumbnail
          {...{ projectName, entityId, entityType }}
          onError={() => setThumbnailError(true)}
          iconOnly={thumbnailError}
          entityUpdatedAt={updatedAt}
          icon={icon}
        />
      </Styled.Card>
    </Styled.Container>
  )
}

export default ActivityVersions

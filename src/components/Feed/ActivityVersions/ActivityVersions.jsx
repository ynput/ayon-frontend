import ActivityHeader from '../ActivityHeader/ActivityHeader'
import * as Styled from './ActivityVersions.styled'
import { productTypes } from '/src/features/project'
import { useState } from 'react'

const ActivityVersions = ({ activity, projectInfo, projectName, entityType, onReferenceClick }) => {
  let { authorName, authorFullName, createdAt, versions = [] } = activity

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
      {versions.map(({ name, id, productName, productType, updatedAt }) => (
        <Styled.Card
          key={id}
          onClick={() => onReferenceClick({ entityType: 'version', entityId: id, projectName })}
        >
          <Styled.Content>
            <Styled.Title>{productName}</Styled.Title>
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
      ))}
    </Styled.Container>
  )
}

export default ActivityVersions

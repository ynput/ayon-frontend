import { useMemo } from 'react'
import {
  DetailsPanelAttributesEditor,
  DetailsPanelAttributesEditorProps,
} from '../DetailsPanelAttributes/DetailsPanelAttributesEditor'
import type { DetailsPanelEntityData } from '@shared/api'
import { useGetActivitiesInfiniteInfiniteQuery } from '@shared/api'
import { DescriptionSection } from './DescriptionSection'
import { DetailsSection } from './DetailsSection'
import styled from 'styled-components'
import { useEntityFormData, useEntityFields, useEntityEditing } from './hooks'
import { useDetailsPanelContext, useGlobalContext, useProjectContext } from '@shared/context'
import type { DetailsPanelEntityType } from '@shared/api'
import ActivityReferenceTooltip from '@shared/containers/Feed/components/ActivityReferenceTooltip/ActivityReferenceTooltip'
import useReferenceTooltip from '@shared/containers/Feed/hooks/useReferenceTooltip'

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 12px;
  overflow-y: auto;
  padding-right: 8px;
  padding-left: 8px;
  margin-top: 16px;
`

export type DetailsPanelDetailsProps = {
  entities: DetailsPanelEntityData[]
  isLoading: boolean
}

export const DetailsPanelDetails = ({ entities = [], isLoading }: DetailsPanelDetailsProps) => {
  const { formData, mixedFields, updateFormData, clearMixedField } = useEntityFormData(
    entities,
    isLoading,
  )

  const { attributes } = useGlobalContext()
  const {
    folderTypes = [],
    taskTypes = [],
    statuses = [],
    tags = [],
    productTypes,
  } = useProjectContext()
  const { openSlideOut } = useDetailsPanelContext()
  const [, setRefTooltip] = useReferenceTooltip()

  // Determine if any selected folder has published versions
  const folderEntities = (entities || []).filter((entity) => entity.entityType === 'folder')
  const { data: versionActivitiesData } = useGetActivitiesInfiniteInfiniteQuery(
    {
      entityIds: folderEntities.map((e) => e.id),
      projectName: formData?.projectName || '',
      referenceTypes: ['origin', 'mention', 'relation'],
      activityTypes: ['version.publish'],
    },
    {
      skip: !formData?.projectName || folderEntities.length === 0,
    },
  )

  const folderHasVersions = Boolean(versionActivitiesData?.pages?.[0]?.activities?.length)

  const { editableFields, readOnlyFieldsData } = useEntityFields({
    attributes,
    folderTypes,
    taskTypes,
    statuses,
    tags,
    entityType: formData?.entityType,
    folderHasVersions,
  })

  const entityType = formData?.entityType || 'task'
  const { enableEditing, updateEntity } = useEntityEditing({
    entities,
    entityType,
  })

  const handleChange: DetailsPanelAttributesEditorProps['onChange'] = (key, value) => {
    if (key === 'tags') {
      if (Array.isArray(value)) {
        // keep as-is
      } else if (value === null || value === undefined || value === '') {
        value = []
      } else {
        value = [String(value)]
      }
    }

    if (key.startsWith('attrib.')) {
      value = {
        [key.replace('attrib.', '')]: value,
      }
      key = 'attrib'
    }

    updateFormData(key, value)
    updateEntity(key, value)
  }

  // mention the same users, tasks and versions as the comments of the (first) entity
  const projectName = formData?.projectName || entities[0]?.projectName
  const entityId = entities[0]?.id
  const mentionsContext = useMemo(
    () =>
      projectName && entityId
        ? { projectName, entityType, entityId, productTypes, taskTypes }
        : undefined,
    [projectName, entityType, entityId, productTypes, taskTypes],
  )

  const handleMentionClick = ({ type, id }: { type: string; id: string }) => {
    if (type === 'user' || type === 'team' || !projectName) return
    openSlideOut({ entityId: id, entityType: type as DetailsPanelEntityType, projectName })
  }

  // the same tooltip as mentions in the feed
  const handleMentionHover = (
    { type, id, label }: { type: string; id: string; label: string },
    target: HTMLElement,
  ) => {
    const { x, y, width } = target.getBoundingClientRect()
    setRefTooltip({ id, name: id, type, label, pos: { left: x + width / 2, top: y } })
  }

  const handleDescriptionChange = (description: string) => {
    updateFormData('description', description)
    clearMixedField('description')
    updateEntity('attrib', { description })
  }

  return (
    <StyledContainer>
      <DescriptionSection
        description={formData?.description || ''}
        isMixed={mixedFields.includes('description')}
        enableEditing={enableEditing}
        onChange={handleDescriptionChange}
        isLoading={isLoading}
        mentionsContext={mentionsContext}
        onMentionClick={handleMentionClick}
        onMentionHover={handleMentionHover}
      />
      <ActivityReferenceTooltip />

      <DetailsPanelAttributesEditor
        fields={editableFields}
        form={formData || {}}
        mixedFields={mixedFields}
        isLoading={isLoading}
        enableEditing={enableEditing}
        onChange={handleChange}
        entities={entities}
        entityType={entityType}
      />

      <DetailsSection
        fields={readOnlyFieldsData}
        form={formData || {}}
        mixedFields={mixedFields}
        isLoading={isLoading}
      />
    </StyledContainer>
  )
}

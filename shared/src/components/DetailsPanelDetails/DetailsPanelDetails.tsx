import {
  DetailsPanelAttributesEditor,
  DetailsPanelAttributesEditorProps,
} from '../DetailsPanelAttributes/DetailsPanelAttributesEditor'
import type { DetailsPanelEntityData } from '@shared/api'
import { DescriptionSection } from './DescriptionSection'
import { DetailsSection } from './DetailsSection'
import styled from 'styled-components'
import {
  useEntityFormData,
  useEntityFields,
  useEntityEditing,
  useEntityData,
} from './hooks'

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 12px;
  overflow-y: auto;
  padding-right: 8px;
  padding-left: 8px;
  padding-bottom: 68px;
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

  const { folderTypes, taskTypes, statuses, tags, attributes } = useEntityData({
    projectName: formData?.projectName,
    isProjectNameMixed: mixedFields.includes('projectName'),
  })

  const { editableFields, readOnlyFieldsData } = useEntityFields({
    attributes,
    folderTypes,
    taskTypes,
    statuses,
    tags,
    entityType: formData?.entityType,
  })

  const entityType = formData?.entityType || 'task'
  const { enableEditing, updateEntity } = useEntityEditing({
    entities,
    entityType,
  })

  const handleChange: DetailsPanelAttributesEditorProps["onChange"] = (key, value) => {
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
      />

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

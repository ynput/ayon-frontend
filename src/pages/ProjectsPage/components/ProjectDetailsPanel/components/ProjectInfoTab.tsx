import { FC, useMemo, useState, useEffect } from 'react'
import styled from 'styled-components'
import { toast } from 'react-toastify'
import { Project, useUpdateProjectMutation, useGetAttributeListQuery } from '@shared/api'
import {
  DescriptionSection,
  DetailsSection,
  DetailsPanelAttributesEditor,
  AttributeField,
} from '@shared/components'

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 8px;
  overflow-y: auto;
  flex: 1;
`

interface ProjectInfoTabProps {
  projectName: string
  project: Project | undefined
  isLoading: boolean
}

const ProjectInfoTab: FC<ProjectInfoTabProps> = ({ projectName, project, isLoading }) => {
  const [updateProject] = useUpdateProjectMutation()
  const { data: allAttributes = [] } = useGetAttributeListQuery()

  // Build a flat form state for the editor
  const buildFormFromProject = (p: Project | undefined): Record<string, any> => {
    if (!p) return {}
    const form: Record<string, any> = {
      label: p.label ?? '',
      code: p.code ?? '',
      active: p.active ?? false,
      library: p.library ?? false,
    }
    // flatten attrib
    const attrib = (p as any).attrib || {}
    for (const key of Object.keys(attrib)) {
      form[`attrib.${key}`] = attrib[key]
    }
    return form
  }

  const [form, setForm] = useState<Record<string, any>>(() => buildFormFromProject(project))

  useEffect(() => {
    setForm(buildFormFromProject(project))
  }, [project])

  // Build attribute fields: label, code, project-scoped attribs, then active, library
  const fields: AttributeField[] = useMemo(() => {
    const topLevel: AttributeField[] = [
      { name: 'label', data: { type: 'string', title: 'Label' } },
      { name: 'code', data: { type: 'string', title: 'Code' } },
    ]

    const projectAttribs: AttributeField[] = allAttributes
      .filter((a) => a.scope?.includes('project'))
      .map((a) => ({
        name: `attrib.${a.name}`,
        data: a.data,
      }))

    const booleans: AttributeField[] = [
      { name: 'active', data: { type: 'boolean', title: 'Active' } },
      { name: 'library', data: { type: 'boolean', title: 'Library' } },
    ]

    return [...topLevel, ...projectAttribs, ...booleans]
  }, [allAttributes])

  // Read-only detail fields: name, createdAt, updatedAt
  const detailFields: AttributeField[] = [
    { name: 'name', data: { title: 'Name' } },
    { name: 'createdAt', data: { title: 'Created at' } },
    { name: 'updatedAt', data: { title: 'Updated at' } },
  ]

  const detailForm: Record<string, any> = {
    name: project?.name ?? '',
    createdAt: (project as any)?.createdAt ?? '',
    updatedAt: (project as any)?.updatedAt ?? '',
  }

  const handleChange = async (key: string, value: any) => {
    // Optimistically update local form
    setForm((prev) => ({ ...prev, [key]: value }))

    try {
      if (key.startsWith('attrib.')) {
        const attribKey = key.replace('attrib.', '')
        await updateProject({
          projectName,
          projectPatchModel: { attrib: { [attribKey]: value } },
        }).unwrap()
      } else {
        await updateProject({
          projectName,
          projectPatchModel: { [key]: value },
        }).unwrap()
      }
    } catch (error: any) {
      toast.error('Failed to update: ' + (error?.message ?? 'Unknown error'))
      // Revert on error
      setForm(buildFormFromProject(project))
    }
  }

  const handleDescriptionChange = async (description: string) => {
    setForm((prev) => ({ ...prev, 'attrib.description': description }))
    try {
      await updateProject({
        projectName,
        projectPatchModel: { attrib: { description } },
      }).unwrap()
    } catch (error: any) {
      toast.error('Failed to update description: ' + (error?.message ?? 'Unknown error'))
      setForm(buildFormFromProject(project))
    }
  }

  const descriptionValue: string =
    (form['attrib.description'] as string) ?? (project as any)?.attrib?.description ?? ''

  return (
    <StyledContainer>
      <DescriptionSection
        description={descriptionValue}
        isMixed={false}
        enableEditing={true}
        onChange={handleDescriptionChange}
        isLoading={isLoading}
        isLarge={false}
      />

      <DetailsPanelAttributesEditor
        fields={fields}
        form={form}
        isLoading={isLoading}
        enableEditing={true}
        onChange={handleChange}
        entityType="project"
      />

      <DetailsSection fields={detailFields} form={detailForm} isLoading={isLoading} />
    </StyledContainer>
  )
}

export default ProjectInfoTab

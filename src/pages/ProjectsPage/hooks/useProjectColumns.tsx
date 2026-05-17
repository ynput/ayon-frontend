import { useMemo } from 'react'
import { AttributeData, AttributeModel, useGetAttributeListQuery } from '@shared/api'
import { ColumnDef, createColumnHelper } from '@tanstack/react-table'
import type { ProjectTableRow } from './useGetProjectsData'
import ProjectThumbnailUploader from '../components/ProjectThumbnailUploader'
import * as Styled from '../ProjectsPage.styled'

const columnHelper = createColumnHelper<ProjectTableRow>()

export type ProjectTableColumnAttributeData = Record<string, AttributeData>

const STATIC_COLUMNS: ColumnDef<ProjectTableRow, any>[] = [
  columnHelper.accessor('name', {
    id: 'thumbnail',
    header: 'Thumbnail',
    size: 70,
    meta: {
      listTableCustomCell: true,
    },
    cell: (info) => (
      <ProjectThumbnailUploader
        projectName={info.getValue()}
        Thumbnail={({ projectName, updatedAt }) => (
          <Styled.Thumbnail
            src={`/api/projects/${projectName}/thumbnail?updatedAt=${updatedAt}`}
            alt={`${projectName} thumbnail`}
          />
        )}
      />
    ),
  }),
  columnHelper.accessor('name', {
    id: 'name',
    header: 'Name',
    size: 200,
  }),
  columnHelper.accessor('label', {
    id: 'label',
    header: 'Label',
    size: 200,
  }),
  columnHelper.accessor('code', {
    id: 'code',
    header: 'Code',
    size: 100,
  }),
  columnHelper.accessor('active', {
    id: 'active',
    header: 'Active',
    size: 80,
  }),
  columnHelper.accessor('library', {
    id: 'library',
    header: 'Library',
    size: 80,
  }),
]

const isProjectScopedAttribute = (attribute: AttributeModel) => attribute.scope?.includes('project')

export const useProjectColumns = (
  rows: ProjectTableRow[],
): {
  columns: ColumnDef<ProjectTableRow, any>[]
  columnAttributeData: ProjectTableColumnAttributeData
} => {
  const { data: attributes = [] } = useGetAttributeListQuery()

  const attribKeys = useMemo(() => {
    const keys = new Set<string>()
    for (const row of rows) {
      for (const key of Object.keys(row.attrib)) {
        keys.add(key)
      }
    }
    return Array.from(keys)
  }, [rows])

  const projectAttributes = useMemo(() => attributes.filter(isProjectScopedAttribute), [attributes])

  const columnAttribsAttributeData = useMemo<ProjectTableColumnAttributeData>(
    () =>
      attribKeys.reduce<ProjectTableColumnAttributeData>((acc, key) => {
        const attribute = projectAttributes.find((item) => item.name === key)
        if (attribute?.data) {
          acc[`attrib_${key}`] = attribute.data
        }
        return acc
      }, {}),
    [attribKeys, projectAttributes],
  )

  const columnAttributeData = useMemo<ProjectTableColumnAttributeData>(
    () => ({
      label: { type: 'string' },
      code: { type: 'string' },
      active: { type: 'boolean' },
      library: { type: 'boolean' },
      ...columnAttribsAttributeData,
    }),
    [columnAttribsAttributeData],
  )

  const attribColumns = useMemo<ColumnDef<ProjectTableRow, any>[]>(
    () =>
      attribKeys.map((key) =>
        columnHelper.accessor((row) => row.attrib[key], {
          id: `attrib_${key}`,
          header: key,
          size: 150,
        }),
      ),
    [attribKeys],
  )

  const columns = useMemo(() => [...STATIC_COLUMNS, ...attribColumns], [attribColumns])

  return useMemo(() => ({ columns, columnAttributeData }), [columns, columnAttributeData])
}

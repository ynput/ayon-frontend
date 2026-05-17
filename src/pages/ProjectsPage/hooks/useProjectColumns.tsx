import { useMemo } from 'react'
import { ColumnDef, createColumnHelper } from '@tanstack/react-table'
import type { ProjectTableRow } from './useGetProjectsData'
import ProjectThumbnailUploader from '../components/ProjectThumbnailUploader'
import * as Styled from '../ProjectsPage.styled'

const columnHelper = createColumnHelper<ProjectTableRow>()

const STATIC_COLUMNS: ColumnDef<ProjectTableRow, any>[] = [
  columnHelper.accessor('name', {
    id: 'thumbnail',
    header: 'Thumbnail',
    size: 70,
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
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('label', {
    id: 'label',
    header: 'Label',
    size: 200,
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('code', {
    id: 'code',
    header: 'Code',
    size: 100,
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('active', {
    id: 'active',
    header: 'Active',
    size: 80,
    cell: (info) => (info.getValue() ? 'Yes' : 'No'),
  }),
  columnHelper.accessor('library', {
    id: 'library',
    header: 'Library',
    size: 80,
    cell: (info) => (info.getValue() ? 'Yes' : 'No'),
  }),
]

export const useProjectColumns = (rows: ProjectTableRow[]): ColumnDef<ProjectTableRow, any>[] => {
  const attribKeys = useMemo(() => {
    const keys = new Set<string>()
    for (const row of rows) {
      for (const key of Object.keys(row.attrib)) {
        keys.add(key)
      }
    }
    return Array.from(keys)
  }, [rows])

  const attribColumns = useMemo<ColumnDef<ProjectTableRow, any>[]>(
    () =>
      attribKeys.map((key) =>
        columnHelper.accessor((row) => row.attrib[key], {
          id: `attrib_${key}`,
          header: key,
          size: 150,
          cell: (info) => {
            const value = info.getValue()
            if (value === null || value === undefined) return ''
            if (typeof value === 'object') return JSON.stringify(value)
            return String(value)
          },
        }),
      ),
    [attribKeys],
  )

  return useMemo(() => [...STATIC_COLUMNS, ...attribColumns], [attribColumns])
}

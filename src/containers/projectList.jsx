import { useMemo } from 'react'
import { TablePanel, Section } from '@ynput/ayon-react-components'

import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { useGetAllProjectsQuery } from '../services/getProject'
import { useSelector } from 'react-redux'
import { useEffect } from 'react'

const formatName = (rowData, defaultTitle) => {
  if (rowData.name === '_') return defaultTitle
  return rowData.name
}

const ProjectList = ({
  selection,
  onSelect,
  onRowClick,
  showNull,
  multiselect,
  footer,
  style,
  styleSection,
  className,
  hideCode,
  onNoProject,
  onSuccess,
  autoSelect,
}) => {
  const user = useSelector((state) => state.user)
  // QUERY HOOK
  // ( default ) gets added in transformResponse
  // pass user to force update when user changes
  const { data = [], isLoading, isError, error, isSuccess } = useGetAllProjectsQuery({ user })
  if (isError) {
    console.error(error)
  }

  // if selection does not exist in data, set selection to null
  useEffect(() => {
    if (isLoading) return

    if (onNoProject && !data.map((project) => project.name).includes(selection)) {
      console.log('selected project does not exist: ', selection)
      const defaultProject = autoSelect ? data[0]?.name : null
      onNoProject(defaultProject)
    } else if (isSuccess && onSuccess) onSuccess()
  }, [selection, data, onNoProject, isLoading])

  const projectList = [...data]

  if (showNull) projectList.unshift({ name: '_' })

  const selectionObj = useMemo(() => {
    if (multiselect) {
      let result = []
      for (const project of projectList) {
        if (selection === null) {
          if (project.name === '_') {
            result.push(project)
            break
          }
          // if (project.name === localStorage.getItem('lastProject')) {
          //   result.push(project)
          //   break
          // }
        }
        if (selection?.includes(project.name)) result.push(project)
      }
      return result
    } else {
      for (const project of projectList) {
        if (project.name === selection) return project
        if (!selection && project.name === '_') return project
        //  if (!selection && project.name === localStorage.getItem('lastProject')) return project
      }
    } // single select
  }, [selection, projectList])

  const onSelectionChange = (e) => {
    if (multiselect) {
      let result = []
      for (const node of e.value) {
        if (node.name === '_') {
          result = null
          break
        }
        result.push(node.name)
      }
      onSelect(result)
    } // multiselect
    else {
      if (e.value.name === '_') onSelect(null)
      else onSelect(e.value.name)
    } // single select
  } // onSelectionChange

  return (
    <Section style={{ maxWidth: 400, ...styleSection }} className={className}>
      {footer}
      <TablePanel loading={isLoading}>
        <DataTable
          value={projectList}
          scrollable="true"
          scrollHeight="flex"
          selectionMode={multiselect ? 'multiple' : 'single'}
          responsive="true"
          dataKey="name"
          selection={selectionObj}
          onSelectionChange={onSelect && onSelectionChange}
          onRowClick={onRowClick}
        >
          <Column
            field="name"
            header="Project name"
            body={(rowData) => formatName(rowData, showNull)}
            style={{ minWidth: 150, ...style }}
          />
          {!hideCode && <Column field="code" header="Code" style={{ maxWidth: 80 }} />}
        </DataTable>
      </TablePanel>
    </Section>
  )
}

export default ProjectList

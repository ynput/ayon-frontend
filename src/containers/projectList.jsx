import { useMemo, useState } from 'react'
import { TablePanel, Section, Button } from '@ynput/ayon-react-components'

import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { useGetAllProjectsQuery } from '../services/project/getProject'
import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import useCreateContext from '../hooks/useCreateContext'

const formatName = (rowData, defaultTitle) => {
  if (rowData.name === '_') return defaultTitle
  return rowData.name
}

const ProjectList = ({
  selection,
  onSelect,
  onRowClick,
  onRowDoubleClick,
  showNull,
  multiselect,
  style,
  styleSection,
  className,
  hideCode,
  onNoProject,
  onSuccess,
  autoSelect,
  isProjectManager,
  onDeleteProject,
  onNewProject,
  onHide,
}) => {
  const [contextProject, setContextProject] = useState()
  const navigate = useNavigate()
  // const user = useSelector((state) => state.user)
  // QUERY HOOK
  // ( default ) gets added in transformResponse
  const { data = [], isLoading, isFetching, isError, error, isSuccess } = useGetAllProjectsQuery()
  if (isError) {
    console.error(error)
  }

  // if selection does not exist in data, set selection to null
  useEffect(() => {
    if (isLoading || isFetching) return

    if (onNoProject && !data.map((project) => project.name).includes(selection)) {
      console.log('selected project does not exist: ', selection)
      const defaultProject = autoSelect ? data[0]?.name : null
      onNoProject(defaultProject)
    } else if (isSuccess && onSuccess) onSuccess()
  }, [selection, data, onNoProject, isLoading])

  let projectList = [...data]

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
        }
        if (selection?.includes(project.name)) result.push(project)
      }
      return result
    } else {
      for (const project of projectList) {
        if (project.name === selection) return project
        if (!selection && project.name === '_') return project
      }
    } // single select
  }, [selection, projectList, isFetching])

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

  const manage = {
    label: 'Manage Project',
    icon: 'empty_dashboard',
    command: () => {
      navigate(`/manageProjects/dashboard?project=${contextProject ? contextProject : selection}`)
      onHide()
    },
  }

  // GLOBAL CONTEXT MENU
  const globalContextItems = useMemo(() => {
    const menuItems = []

    if (!isProjectManager) menuItems.push({ ...manage, label: 'Manage Projects' })

    if (onNewProject)
      menuItems.push({
        label: 'Create Project',
        icon: 'create_new_folder',
        command: onNewProject,
      })

    return menuItems
  }, [onNewProject, isProjectManager])

  // create the ref and model
  const [globalContextMenuShow] = useCreateContext(globalContextItems)

  // TABLE CONTEXT MENU
  const tableContextItems = useMemo(() => {
    const managerMenuItems = [
      {
        label: 'Open Project',
        icon: 'event_list',
        command: () => onRowDoubleClick({ data: { name: selection } }),
      },
      {
        label: 'Create Project',
        icon: 'create_new_folder',
        command: onNewProject,
      },
      {
        label: 'Delete Project',
        icon: 'delete',
        command: onDeleteProject,
      },
    ]

    const globalMenuItems = [
      {
        label: 'Open Project',
        icon: 'event_list',
        command: () => onRowClick({ data: { name: contextProject || selection } }),
      },
      manage,
    ]

    if (onNewProject)
      globalMenuItems.push({
        label: 'Create Project',
        icon: 'create_new_folder',
        command: onNewProject,
      })

    let menuItems = managerMenuItems
    if (!isProjectManager) menuItems = globalMenuItems

    return menuItems
  }, [data, selection, contextProject])

  // create the ref and model
  const [tableContextMenuShow] = useCreateContext(tableContextItems)

  const onContextMenuSelectionChange = (event) => {
    if (!selection?.includes(event.value.name)) {
      onSelect ? onSelect(event.value.name) : setContextProject(event.value.name)
    }
  }

  // create 10 dummy rows
  const loadingData = useMemo(() => {
    return Array.from({ length: 10 }, (_, i) => ({
      key: i,
      data: {},
    }))
  }, [])

  if (isLoading) {
    projectList = loadingData
  }

  return (
    <Section style={{ maxWidth: 400, ...styleSection }} className={className}>
      {isProjectManager && (
        <Button label="Add New Project" icon="create_new_folder" onClick={onNewProject} />
      )}
      <TablePanel onContextMenu={globalContextMenuShow}>
        <DataTable
          value={projectList}
          scrollable="true"
          scrollHeight="flex"
          selectionMode={multiselect ? 'multiple' : 'single'}
          responsive="true"
          dataKey="name"
          emptyMessage=" "
          selection={selectionObj}
          onSelectionChange={onSelect && onSelectionChange}
          onRowClick={onRowClick}
          onRowDoubleClick={onRowDoubleClick}
          onContextMenu={(e) => tableContextMenuShow(e.originalEvent)}
          onContextMenuSelectionChange={onContextMenuSelectionChange}
          className={isLoading ? 'table-loading' : undefined}
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

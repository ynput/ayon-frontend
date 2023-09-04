import { useMemo, useRef, useState } from 'react'
import { TablePanel, Section } from '@ynput/ayon-react-components'

import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { useGetAllProjectsQuery } from '../services/project/getProject'
import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import useCreateContext from '../hooks/useCreateContext'
import useLocalStorage from '../hooks/useLocalStorage'
import CollapseButton from '../components/CollapseButton'
import styled, { css } from 'styled-components'

const formatName = (rowData, defaultTitle, field = 'name') => {
  if (rowData[field] === '_') return defaultTitle
  return rowData[field]
}

const StyledProjectName = styled.div`
  /* use grid to stack items on top of each other */
  display: grid;
  grid-template-columns: 1fr;

  span {
    grid-area: 1 / 1 / 2 / 2;
    transition: opacity 0.15s;
  }

  /* when open hide the code */
  span:last-child {
    opacity: 0;
  }

  /* when closed show code and hide title */
  ${({ $isOpen }) =>
    !$isOpen &&
    css`
      span:first-child {
        opacity: 0;
      }
      span:last-child {
        opacity: 1;
      }
    `}
`

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
  onHide,
  isCollapsible = false,
  wrap,
}) => {
  const [contextProject, setContextProject] = useState()
  const navigate = useNavigate()
  const tableRef = useRef(null)

  // const user = useSelector((state) => state.user)
  // QUERY HOOK
  // ( default ) gets added in transformResponse
  const { data = [], isLoading, isFetching, isError, error, isSuccess } = useGetAllProjectsQuery()
  if (isError) {
    console.error(error)
  }

  useEffect(() => {
    if (isProjectManager || isLoading) return
    // set focus to table
    if (tableRef.current) {
      const tableEl = tableRef.current.getTable()
      const focusableEl = tableEl?.querySelector('.p-selectable-row')

      if (focusableEl) focusableEl.focus()
    }
  }, [tableRef, isLoading, isProjectManager])

  // localstorage collapsible state
  let [collapsed, setCollapsed] = useLocalStorage('projectListCollapsed', false)
  // always set to false if not collapsible
  if (!isCollapsible) collapsed = false

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
      onHide()
      navigate(`/manageProjects/dashboard?project=${contextProject ? contextProject : selection}`)
    },
  }

  // GLOBAL CONTEXT MENU
  const globalContextItems = useMemo(() => {
    const menuItems = []

    if (!isProjectManager) menuItems.push({ ...manage, label: 'Manage Projects' })

    menuItems.push({
      label: 'Create new Project',
      icon: 'create_new_folder',
      command: () => navigate('/manageProjects/new'),
    })

    return menuItems
  }, [isProjectManager])

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
        label: 'Create new Project',
        icon: 'create_new_folder',
        command: () => navigate('/manageProjects/new'),
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

    globalMenuItems.push({
      label: 'Create Project',
      icon: 'create_new_folder',
      command: () => navigate('/manageProjects/new'),
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

  const sectionStyle = {
    ...styleSection,
    maxWidth: collapsed ? 38 : styleSection?.maxWidth,
    minWidth: collapsed ? 38 : styleSection?.minWidth,
    transition: 'max-width 0.15s, min-width 0.15s',
  }

  return (
    <Section style={sectionStyle} className={className} wrap={wrap}>
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
          className={`${isLoading ? 'table-loading ' : ''}project-list${
            collapsed ? ' collapsed' : ''
          }
          ${isCollapsible ? ' collapsible' : ''}
          `}
          style={{
            maxWidth: 'unset',
          }}
          ref={tableRef}
        >
          <Column
            field="name"
            header={
              <>
                <span className="title">Project</span>
                {isCollapsible && (
                  <CollapseButton
                    onClick={() => setCollapsed(!collapsed)}
                    isOpen={!collapsed}
                    side="left"
                    // style={{ position: 'absolute', right: 4, top: 4 }}
                  />
                )}
              </>
            }
            body={(rowData) => (
              <StyledProjectName $isOpen={!collapsed}>
                <span>{formatName(rowData, showNull)}</span>
                <span>{formatName(rowData, showNull, 'code')}</span>
              </StyledProjectName>
            )}
            style={{ minWidth: 150, ...style }}
          />
          {!hideCode && <Column field="code" header="Code" style={{ maxWidth: 80 }} />}
        </DataTable>
      </TablePanel>
    </Section>
  )
}

export default ProjectList

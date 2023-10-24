import { useCallback, useMemo, useRef } from 'react'
import { TablePanel, Section, Button, Icon } from '@ynput/ayon-react-components'

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

const StyledAddButton = styled(Button)`
  overflow: hidden;
  position: relative;
  justify-content: flex-start;
  gap: 0;

  .content {
    display: flex;
    gap: 4px;
    position: relative;

    transition: transform 0.15s;
    transition-delay: 0.015s;

    left: 50%;
    transform: translateX(-50%);
  }

  .title {
    transition: opacity 0.15s;
  }

  /* closed */
  ${({ $isOpen }) =>
    !$isOpen &&
    css`
      .content {
        transform: translateX(-10px);
      }

      .title {
        opacity: 0;
      }
    `}
`

const ProjectList = ({
  selection,
  onSelect,
  onRowClick,
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
  isCollapsible = false,
  collapsedId = 'global',
  wrap,
  onSelectAll,
  onSelectAllDisabled,
}) => {
  const navigate = useNavigate()
  const tableRef = useRef(null)

  // const user = useSelector((state) => state.user)
  // QUERY HOOK
  // ( default ) gets added in transformResponse
  const { data = [], isLoading, isFetching, isError, error, isSuccess } = useGetAllProjectsQuery()
  if (isError) {
    console.error(error)
  }

  // localstorage collapsible state
  let [collapsed, setCollapsed] = useLocalStorage(collapsedId + '-projectListCollapsed', false)
  // always set to false if not collapsible
  if (!isCollapsible) collapsed = false
  const projectNames = data.map((project) => project.name)

  // if selection does not exist in data, set selection to null
  useEffect(() => {
    if (isLoading || isFetching) return

    let foundProject = false
    if (multiselect && typeof selection === 'object') {
      foundProject = projectNames.some((project) => selection?.includes(project))
    } else {
      foundProject = projectNames.includes(selection)
    }

    if (onNoProject && !foundProject) {
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

  // TABLE CONTEXT MENU
  const getContextItems = useCallback(
    (sel) => {
      const menuItems = [
        {
          label: 'Open Project',
          icon: 'event_list',
          command: () => navigate(`/projects/${sel[0]}/browser`),
        },
      ]

      // if not on project manager page
      if (!isProjectManager) {
        menuItems.push({
          label: 'Manage Project',
          icon: 'settings_applications',
          command: () => {
            closeContextMenu()
            navigate(`/manageProjects?project=${sel[0]}`)
          },
        })
      }

      const managerMenuItems = [
        {
          label: 'Create Project',
          icon: 'create_new_folder',
          command: onNewProject,
        },
        {
          label: 'Delete Project',
          icon: 'delete',
          command: () => onDeleteProject(sel[0]),
          danger: true,
        },
      ]

      if (isProjectManager) menuItems.push(...managerMenuItems)

      return menuItems
    },
    [data, onNewProject, onDeleteProject, onRowClick, isProjectManager],
  )

  // create the ref and model
  const [tableContextMenuShow, closeContextMenu] = useCreateContext([])

  // When right clicking on the already selected node, we don't want to change the selection
  const onContextMenu = (event) => {
    let newSelection = selection

    if (multiselect) {
      if (event?.data?.name && !selection?.includes(event.data.name)) {
        // if the selection does not include the clicked node, new selection is the clicked node
        newSelection = [event.data.name]
        // update selection state
        onSelect(newSelection)
      }
    } else {
      // single select gets converted to array
      newSelection = [event.data.name]
      // update selection state
      onSelect(event.data.name)
    }

    tableContextMenuShow(event.originalEvent, getContextItems(newSelection))
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
      {onSelectAll && (
        <Button
          label={!collapsed && 'Select all projects'}
          onClick={() => onSelectAll(projectNames)}
          icon={collapsed && 'checklist'}
          disabled={onSelectAllDisabled}
        />
      )}
      {isProjectManager && (
        <StyledAddButton onClick={onNewProject} $isOpen={!collapsed}>
          {/* <div className="spacer" /> */}
          <div className="content">
            <Icon icon="create_new_folder" />
            <span className="title">Add New Project</span>
          </div>
          {/* <div className="spacer" /> */}
        </StyledAddButton>
      )}
      <TablePanel>
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
          onRowDoubleClick={(e) => navigate(`/projects/${e.data.name}/browser`)}
          onContextMenu={onContextMenu}
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

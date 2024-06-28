import { useCallback, useMemo, useRef } from 'react'
import { useSelector } from 'react-redux'
import { TablePanel, Section, Button, Icon } from '@ynput/ayon-react-components'

import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { useListProjectsQuery } from '@queries/project/getProject'
import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import useCreateContext from '@hooks/useCreateContext'
import useLocalStorage from '@hooks/useLocalStorage'
import CollapseButton from '@components/CollapseButton'
import styled, { css } from 'styled-components'
import { classNames } from 'primereact/utils'

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

  ${({ $isActive }) =>
    !$isActive &&
    css`
      font-style: italic;
      color: var(--md-ref-palette-secondary50);
    `}

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
    gap: var(--base-gap-small);
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
  onActivateProject,
  onNewProject,
  isCollapsible = false,
  collapsedId = 'global',
  wrap,
  onSelectAll,
  onSelectAllDisabled,
}) => {
  const navigate = useNavigate()
  const tableRef = useRef(null)
  const user = useSelector((state) => state.user)
  const pinnedProjects = useSelector((state) => state.user?.data?.frontendPreferences?.pinned) || []

  // by default only show active projects
  const params = { active: true }

  const showInactiveAsWell =
    isProjectManager && (user?.projects?.isAdmin || user?.projects?.isManager)
  if (showInactiveAsWell) {
    // remove active from params
    delete params.active
  }

  const {
    data: projects = [],
    isLoading,
    isFetching,
    isError,
    error,
    isSuccess,
  } = useListProjectsQuery({ ...params })
  if (isError) {
    console.error(error)
  }

  // localstorage collapsible state
  let [collapsed, setCollapsed] = useLocalStorage(collapsedId + '-projectListCollapsed', false)
  // always set to false if not collapsible
  if (!isCollapsible) collapsed = false
  const projectNames = projects.map((project) => project.name)

  // if selection does not exist in projects, set selection to null
  useEffect(() => {
    if (isLoading || isFetching) return

    let foundProject = false
    if (multiselect && typeof selection === 'object') {
      foundProject = projectNames.some((project) => selection?.includes(project))
    } else {
      foundProject = projectNames.includes(selection)
    }

    if (onNoProject && !foundProject) {
      const defaultProject = autoSelect ? projects[0]?.name : null
      onNoProject(defaultProject)
    } else if (isSuccess && onSuccess) onSuccess()
  }, [selection, projects, onNoProject, isLoading])

  const projectListWithPinned = projects
    .map((project) => ({
      ...project,
      // Add a pinned property based on whether the project name is in pinnedProjects
      pinned: pinnedProjects.includes(project.name),
    }))
    .sort((a, b) => {
      // Use the pinned property for sorting
      if (a.pinned && !b.pinned) {
        return -1 // a comes before b
      } else if (!a.pinned && b.pinned) {
        return 1 // b comes before a
      } else {
        // If both have the same pinned status, sort alphabetically by name
        return a.name.localeCompare(b.name)
      }
    })

  const projectList = projectListWithPinned

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
      ]

      const selObject = projects.find((project) => project?.name === sel[0])
      const active = selObject?.active

      // show deactivate button on active projects and activate on inactive projects
      if (onActivateProject) {
        managerMenuItems.push({
          label: active ? 'Deactivate Project' : 'Activate Project',
          icon: active ? 'archive' : 'unarchive',
          command: () => onActivateProject(sel[0], !active),
        })
      }

      // only show delete button on non-active projects
      const disableDelete = active || !onDeleteProject || !selObject

      managerMenuItems.push({
        label: disableDelete ? 'Deactivate to Delete' : 'Delete Project',
        icon: 'delete',
        command: () => onDeleteProject(sel[0]),
        danger: true,
        disabled: disableDelete,
      })

      if (isProjectManager) menuItems.push(...managerMenuItems)

      return menuItems
    },
    [projects, onNewProject, onDeleteProject, onRowClick, isProjectManager],
  )

  // create the ref and model
  const [tableContextMenuShow, closeContextMenu] = useCreateContext([])

  // When right clicking on the already selected node, we don't want to change the selection
  const onContextMenu = (event) => {
    let newSelection = selection

    if (multiselect) {
      if (event?.projects?.name && !selection?.includes(event.projects.name)) {
        // if the selection does not include the clicked node, new selection is the clicked node
        newSelection = [event.projects.name]
        // update selection state
        onSelect(newSelection)
      }
    } else {
      // single select gets converted to array
      newSelection = [event.projects.name]
      // update selection state
      onSelect(event.projects.name)
    }

    tableContextMenuShow(event.originalEvent, getContextItems(newSelection))
  }

  // create 10 dummy rows
  const loadingData = useMemo(() => {
    return Array.from({ length: 10 }, (_, i) => ({
      key: i,
      projects: {},
    }))
  }, [])

  const sectionStyle = {
    ...styleSection,
    maxWidth: collapsed ? 38 : styleSection?.maxWidth,
    minWidth: collapsed ? 38 : styleSection?.minWidth,
    transition: 'max-width 0.15s, min-width 0.15s',
  }

  return (
    <Section
      style={sectionStyle}
      className={classNames('project-list-section', className, { collapsed })}
      wrap={wrap}
    >
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
        {isCollapsible && (
          <CollapseButton
            onClick={() => setCollapsed(!collapsed)}
            isOpen={!collapsed}
            side="left"
          />
        )}
        <DataTable
          value={isLoading ? loadingData : projectList}
          scrollable="true"
          scrollHeight="flex"
          selectionMode={multiselect ? 'multiple' : 'single'}
          responsive="true"
          dataKey="name"
          emptyMessage=" "
          selection={selectionObj}
          onSelectionChange={onSelect && onSelectionChange}
          onRowClick={onRowClick}
          onRowDoubleClick={(e) => navigate(`/projects/${e.projects.name}/browser`)}
          onContextMenu={onContextMenu}
          className={classNames('project-list', {
            'table-loading': isLoading,
            collapsed: collapsed,
            collapsible: isCollapsible,
          })}
          style={{
            maxWidth: 'unset',
          }}
          ref={tableRef}
        >
          <Column
            field="name"
            header="Projects"
            body={(rowData) => (
              <StyledProjectName
                $isOpen={!collapsed}
                $isActive={rowData.name === '_' || rowData.active}
              >
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

import { useMemo, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { TablePanel, Section, Button, Icon } from '@ynput/ayon-react-components'

import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { useListProjectsQuery } from '@shared/api'
import { useEffect } from 'react'
import { useCreateContextMenu } from '@shared/containers/ContextMenu'
import { useLocalStorage } from '@shared/hooks'
import CollapseButton from '@components/CollapseButton'
import styled, { css } from 'styled-components'
import clsx from 'clsx'
import { toast } from 'react-toastify'
import { useSetFrontendPreferencesMutation } from '@shared/api'
import useTableLoadingData from '@hooks/useTableLoadingData'
import { useProjectSelectDispatcher } from './ProjectMenu/hooks/useProjectSelectDispatcher'
import useAyonNavigate from '@hooks/useAyonNavigate'
import useUserProjectPermissions from '@hooks/useUserProjectPermissions'

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

  ${({ $isActive }) => !$isActive && css``}

  &:not(.isActive) {
    font-style: italic;
    color: var(--md-ref-palette-secondary50);
  }

  &:not(.isOpen) {
    span:first-child {
      opacity: 0;
    }
    span:last-child {
      opacity: 1;
    }
  }
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

const StyledPin = styled(Icon)`
  font-variation-settings: 'FILL' 1, 'wght' 200, 'GRAD' 200, 'opsz' 20;
  margin-left: auto;
  margin-right: 6px;
  font-size: 18px;
  color: var(--md-sys-color-outline);
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
  customSort,
  isActiveCallable,
  hideAddProjectButton = false,
}) => {
  const navigate = useAyonNavigate()
  const tableRef = useRef(null)
  const user = useSelector((state) => state.user)
  const pinnedProjects =
    useSelector((state) => state.user?.data?.frontendPreferences?.pinnedProjects) || []

  const dispatch = useDispatch()
  const [handleProjectSelectionDispatches] = useProjectSelectDispatcher([])

  // by default only show active projects
  const params = { active: true }

  const showInactiveAsWell = isProjectManager && (user?.data?.isAdmin || user?.data?.isManager)
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
      pinned: project.active ? pinnedProjects.includes(project.name) : false,
    }))
    .sort((a, b) => {
      const aActive = a.active ? 10 : -10
      const bActive = a.active ? 10 : -10
      const aPinned = a.pinned ? 1 : -1
      const bPinned = b.pinned ? 1 : -1
      const mainComparison = bActive + bPinned - aActive - aPinned
      if (mainComparison !== 0) {
        return mainComparison
      }

      if (customSort) {
        return customSort(a.name, b.name)
      }

      return a.name.localeCompare(b.name)
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

  const [updateUserPreferences] = useSetFrontendPreferencesMutation()

  const { isLoading: userPermissionsLoading, permissions: userPermissions } =
    useUserProjectPermissions(user?.data?.isUser || true)

  const handlePinProjects = async (sel, isPinning) => {
    try {
      const newPinnedProjects = [...pinnedProjects]
      for (const project of sel) {
        if (isPinning) {
          // check if project is already pinned
          if (!newPinnedProjects.includes(project)) {
            // add to pinned projects
            newPinnedProjects.push(project)
          }
        } else {
          // remove from pinned projects
          const index = newPinnedProjects.indexOf(project)
          newPinnedProjects.splice(index, 1)
        }
      }

      // update user preferences
      await updateUserPreferences({
        userName: user.name,
        patchData: { pinnedProjects: newPinnedProjects },
      }).unwrap()
    } catch (error) {
      console.error(error)
      toast.error('Failed to pin/unpin projects')
    }
  }

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

  const onOpenProject = (sel) => {
    const projectName = sel[0]
    handleProjectSelectionDispatches(projectName)

    const link = `/projects/${projectName}/overview`
    setTimeout(() => dispatch((_, getState) => navigate(getState)(link)), 0)
  }

  // TABLE CONTEXT MENU
  const getContextItems = (sel) => {
    const menuItems = [
      {
        label: 'Open Project',
        icon: 'event_list',
        command: () => {
          closeContextMenu()
          onOpenProject(sel)
        },
      },
    ]

    // toggle pinned status
    // first get if whole selection is pinned or not
    const allPinned = sel.every((project) => pinnedProjects.includes(project))
    let pinnedLabel = allPinned ? 'Unpin Project' : 'Pin Project'
    if (sel.length > 1) pinnedLabel = pinnedLabel + 's'
    menuItems.push({
      label: pinnedLabel,
      icon: 'push_pin',
      command: () => handlePinProjects(sel, !allPinned),
    })

    // if not on project manager page
    if (!isProjectManager) {
      menuItems.push({
        label: 'Manage Project',
        icon: 'settings_applications',
        command: () => {
          closeContextMenu()
          //Enqueing navigation to event loop to avoid close context menu race condition
          setTimeout(
            dispatch((_, getState) =>
              navigate(getState)(`/manageProjects/anatomy?project=${sel[0]}`),
            ),
            0,
          )
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
  }

  // create the ref and model
  const [tableContextMenuShow, closeContextMenu] = useCreateContextMenu([])

  // When right clicking on the already selected node, we don't want to change the selection
  const onContextMenu = (event) => {
    const isActiveCallableValue = isActiveCallable ? isActiveCallable(event.data.name) : true
    if (!isActiveCallableValue) {
      return
    }
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

  const tableData = useTableLoadingData(projectList, isLoading, 10, 'name')

  const sectionStyle = {
    ...styleSection,
    maxWidth: collapsed ? 38 : styleSection?.maxWidth,
    minWidth: collapsed ? 38 : styleSection?.minWidth,
    transition: 'max-width 0.15s, min-width 0.15s',
  }

  return (
    <Section
      style={sectionStyle}
      className={clsx('project-list-section', className, { collapsed })}
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
      {!hideAddProjectButton &&
      (isProjectManager || (!userPermissionsLoading && userPermissions.canCreateProject())) ? (
        <StyledAddButton onClick={onNewProject} $isOpen={!collapsed}>
          {/* <div className="spacer" /> */}
          <div className="content">
            <Icon icon="create_new_folder" />
            <span className="title">Add New Project</span>
          </div>
          {/* <div className="spacer" /> */}
        </StyledAddButton>
      ) : null}

      <TablePanel>
        {isCollapsible && (
          <CollapseButton
            onClick={() => setCollapsed(!collapsed)}
            isOpen={!collapsed}
            side="left"
          />
        )}
        <DataTable
          value={tableData}
          scrollable="true"
          scrollHeight="flex"
          selectionMode={multiselect ? 'multiple' : 'single'}
          responsive="true"
          dataKey="name"
          emptyMessage=" "
          selection={selectionObj}
          onSelectionChange={onSelect && onSelectionChange}
          onRowClick={onRowClick}
          onRowDoubleClick={(e) => onOpenProject([e.data.name])}
          onContextMenu={onContextMenu}
          className={clsx('project-list', {
            loading: isLoading,
            collapsed: collapsed,
            collapsible: isCollapsible,
          })}
          rowClassName={() => ({ loading: isLoading })}
          style={{
            maxWidth: 'unset',
          }}
          ref={tableRef}
        >
          <Column
            field="name"
            header="Projects"
            body={(rowData) => {
              const isActiveCallableValue = isActiveCallable ? isActiveCallable(rowData.name) : true
              return (
                <StyledProjectName
                  className={clsx({
                    isActive: isActiveCallableValue && (rowData.name === '_' || rowData.active),
                    isOpen: !collapsed,
                  })}
                >
                  <span>{formatName(rowData, showNull)}</span>
                  <span>{formatName(rowData, showNull, 'code')}</span>
                </StyledProjectName>
              )
            }}
            style={{ minWidth: 150, ...style }}
          />
          {!hideCode && !collapsed && (
            <Column
              field="code"
              header="Code"
              style={{ maxWidth: 80 }}
              body={(rowData) => {
                const isActiveCallableValue = isActiveCallable
                  ? isActiveCallable(rowData.name)
                  : true
                return (
                  <StyledProjectName
                    className={clsx({
                      isActive: isActiveCallableValue && (rowData.name === '_' || rowData.active),
                    })}
                  >
                    <span>{rowData.code}</span>
                  </StyledProjectName>
                )
              }}
            />
          )}
          {!collapsed && (
            <Column
              field="pinned"
              body={(rowData) => (rowData.pinned ? <StyledPin icon="push_pin" /> : null)}
            />
          )}
        </DataTable>
      </TablePanel>
    </Section>
  )
}

export default ProjectList

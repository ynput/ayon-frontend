// The host's EntityTable (@ynput/ayon-addon): the Overview's table stack for an addon's rows,
// read-only, with the view settings held by the addon. See src/remote/AGENTS.md.
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import type { RowSelectionState } from '@tanstack/react-table'
import { entityUrl, type EntityTableProps, type EntityTableSettings } from '@ynput/ayon-addon'
import { EmptyPlaceholder } from '@shared/components'
import {
  DetailsPanelEntityProvider,
  ProjectDataProvider,
  UNGROUPED_VALUE,
  useOptionalProjectDataContext,
  useProjectTableContext,
} from '@shared/containers/ProjectTreeTable'
import type {
  ContextMenuItemConstructor,
  ContextMenuItemConstructors,
} from '@shared/containers/ProjectTreeTable'
import { SlicerProvider } from '@shared/containers/Slicer'
import { ViewsProvider, type UpdateViewSettingsFn, type ViewSettings } from '@shared/containers/Views'
import {
  ProjectContextProvider,
  ProjectFoldersContextProvider,
  useOptionalProjectContext,
  useOptionalProjectFoldersContext,
} from '@shared/context'
import ProjectOverviewDataProvider from '@pages/ProjectOverviewPage/providers/ProjectOverviewDataProvider'
import ProjectOverviewTable from '@pages/ProjectOverviewPage/containers/ProjectOverviewTable'
import { toEntityTableSettings, toOverviewSettings } from './entityTableHelpers'
import * as Styled from './EntityTable.styled'

const NO_SLICE_SELECTION: RowSelectionState = {}
const noop = () => {}
const noViewUpdate: UpdateViewSettingsFn = async () => {}

// The project's data the Overview stack reads: the page's when it is this project's, else its own
// (a studio page, a dialog for another project).
const ProjectProviders = ({ projectName, children }: { projectName: string; children: ReactNode }) => {
  const project = useOptionalProjectContext()
  const folders = useOptionalProjectFoldersContext()
  const data = useOptionalProjectDataContext()
  if (project?.projectName === projectName && folders && data) return <>{children}</>
  return (
    <ProjectContextProvider projectName={projectName}>
      <ProjectFoldersContextProvider projectName={projectName}>
        <ProjectDataProvider projectName={projectName}>{children}</ProjectDataProvider>
      </ProjectFoldersContextProvider>
    </ProjectContextProvider>
  )
}

// No details panel here: the entity opens on Overview instead
const useReadOnlyMenu = (projectName: string): ContextMenuItemConstructors => {
  const navigate = useNavigate()
  return useMemo(() => {
    const openInOverview: ContextMenuItemConstructor = (_e, cell) => {
      const url = entityUrl({ projectName, entityType: cell.entityType ?? '', id: cell.entityId })
      return {
        id: 'open-in-overview',
        label: 'Open in overview',
        icon: 'open_in_new',
        command: () => url && navigate(url),
        hidden: !url || cell.isGroup,
      }
    }
    return [openInOverview, 'copy-paste', 'open-viewer', 'expand-collapse', 'export']
  }, [projectName, navigate])
}

// A single group (e.g. a clicked chart point) opens expanded, once
const ExpandOnlyGroup = () => {
  const { tableData, expanded, updateExpanded } = useProjectTableContext()
  const groups = tableData.filter((row) => row.group && row.group.value !== UNGROUPED_VALUE)
  const onlyGroupId = groups.length === 1 ? groups[0].id : undefined
  const expandedGroupId = useRef<string>()

  useEffect(() => {
    if (!onlyGroupId || expandedGroupId.current === onlyGroupId) return
    expandedGroupId.current = onlyGroupId
    if (expanded === true || expanded[onlyGroupId]) return
    updateExpanded({ ...expanded, [onlyGroupId]: true })
    // only when the single group changes, not on every expand
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onlyGroupId])

  return null
}

const OverviewEntityTable = ({
  projectName,
  entityType,
  filter,
  ids,
  settings,
  onSettingsChange,
  excludedColumns,
  className,
}: EntityTableProps) => {
  const [ownSettings, setOwnSettings] = useState<EntityTableSettings>({})
  const current = settings ?? ownSettings

  // keyed on the content: an addon may pass a new filter or ids array on every render
  const filterKey = JSON.stringify(filter)
  const idsKey = ids?.join(',')
  const viewSettings = useMemo(
    () => toOverviewSettings({ entityType, filter, ids }, current),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [entityType, filterKey, idsKey, current],
  )

  const handleChange = useCallback(
    (changed: ViewSettings) => {
      const next = toEntityTableSettings(changed, entityType, current)
      if (!settings) setOwnSettings(next)
      onSettingsChange?.(next)
    },
    [entityType, current, settings, onSettingsChange],
  )

  const controlled = useMemo(
    () => ({ settings: viewSettings, onChange: handleChange }),
    [viewSettings, handleChange],
  )

  const contextMenuItems = useReadOnlyMenu(projectName)

  return (
    // the table's own row selection and slicer, apart from the page's
    <DetailsPanelEntityProvider>
      <ViewsProvider controlled={controlled}>
        <SlicerProvider
          page="entity-table"
          projectName={projectName}
          viewSettings={undefined}
          isLoadingViews={false}
          updateViewSettings={noViewUpdate}
          rowSelection={NO_SLICE_SELECTION}
          setRowSelection={noop}
        >
          <Styled.TableWrapper className={className}>
            <ProjectOverviewDataProvider
              readOnly
              page="entity-table"
              contextMenuItems={contextMenuItems}
            >
              <ProjectOverviewTable excludedColumns={excludedColumns} />
              <ExpandOnlyGroup />
            </ProjectOverviewDataProvider>
          </Styled.TableWrapper>
        </SlicerProvider>
      </ViewsProvider>
    </DetailsPanelEntityProvider>
  )
}

const SUPPORTED_TYPES: string[] = ['task', 'folder']

const AddonEntityTable = (props: EntityTableProps) => {
  // a newer addon may ask for a type this AYON can't list yet
  if (!SUPPORTED_TYPES.includes(props.entityType)) {
    const label = props.entityType.charAt(0).toUpperCase() + props.entityType.slice(1)
    return (
      <Styled.TableWrapper className={props.className}>
        <EmptyPlaceholder message={`${label}s can't be listed here yet`} />
      </Styled.TableWrapper>
    )
  }
  // an empty id list would mean "not narrowed" to the queries
  if (props.ids && !props.ids.length) {
    return (
      <Styled.TableWrapper className={props.className}>
        <EmptyPlaceholder message={props.entityType === 'folder' ? 'No folders' : 'No tasks'} />
      </Styled.TableWrapper>
    )
  }
  return (
    <ProjectProviders projectName={props.projectName}>
      <OverviewEntityTable {...props} />
    </ProjectProviders>
  )
}

export default AddonEntityTable

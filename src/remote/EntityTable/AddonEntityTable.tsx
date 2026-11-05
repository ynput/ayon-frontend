// The host's EntityTable (@ynput/ayon-addon): the Overview's table stack for an addon's rows,
// read-only, with the view settings held by the addon. See src/remote/AGENTS.md.
import { useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import type { RowSelectionState } from '@tanstack/react-table'
import type { EntityTableProps, EntityTableSettings } from '@ynput/ayon-addon'
import { EmptyPlaceholder } from '@shared/components'
import {
  DetailsPanelEntityProvider,
  ProjectDataContext,
  ProjectDataProvider,
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
  const data = useContext(ProjectDataContext)
  if (project?.projectName === projectName && folders && data) return <>{children}</>
  return (
    <ProjectContextProvider projectName={projectName}>
      <ProjectFoldersContextProvider projectName={projectName}>
        <ProjectDataProvider projectName={projectName}>{children}</ProjectDataProvider>
      </ProjectFoldersContextProvider>
    </ProjectContextProvider>
  )
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

  const viewSettings = useMemo(
    () => toOverviewSettings({ entityType, filter, ids }, current),
    [entityType, filter, ids, current],
  )

  // changes in the same tick (group by, then columns) merge before the addon re-renders with them
  const latest = useRef(current)
  latest.current = current
  const handleChange = useCallback(
    (changed: ViewSettings) => {
      const next = toEntityTableSettings(changed, entityType, latest.current)
      latest.current = next
      if (!settings) setOwnSettings(next)
      onSettingsChange?.(next)
    },
    [entityType, settings, onSettingsChange],
  )

  const controlled = useMemo(
    () => ({ settings: viewSettings, onChange: handleChange }),
    [viewSettings, handleChange],
  )

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
            <ProjectOverviewDataProvider readOnly page="entity-table">
              <ProjectOverviewTable excludedColumns={excludedColumns} />
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
    return <EmptyPlaceholder message={`${label}s can't be listed here yet`} />
  }
  // an empty id list would mean "not narrowed" to the queries
  if (props.ids && !props.ids.length) {
    return <EmptyPlaceholder message={props.entityType === 'folder' ? 'No folders' : 'No tasks'} />
  }
  return (
    <ProjectProviders projectName={props.projectName}>
      <OverviewEntityTable {...props} />
    </ProjectProviders>
  )
}

export default AddonEntityTable

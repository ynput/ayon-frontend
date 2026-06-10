// libraries
import { Splitter, SplitterPanel } from 'primereact/splitter'
import { FC, useMemo } from 'react'
import styled from 'styled-components'

// state
import { Slicer, useSlicerContext } from '@shared/containers/Slicer'

// arc
import { Section, SortingDropdown, Toolbar } from '@ynput/ayon-react-components'
import SearchFilterWrapper from './containers/SearchFilterWrapper'
import ProjectOverviewTable from './containers/ProjectOverviewTable'
import { CustomizeButton, buildScopes } from '@shared/components'
import ProjectOverviewDetailsPanel from './containers/ProjectOverviewDetailsPanel'
import NewEntity from '@components/NewEntity/NewEntity'
import { Actions } from '@shared/containers/Actions/Actions'
import {
  getCellId,
  ROW_SELECTION_COLUMN_ID,
  useColumnSettingsContext,
  useGetGroupedFields,
  useSelectionCellsContext,
} from '@shared/containers/ProjectTreeTable'
import { useProjectOverviewContext } from './context/ProjectOverviewContext'
import ProjectOverviewSettings from './containers/ProjectOverviewSettings'
import { useGlobalContext, useSettingsPanel } from '@shared/context'
import ReloadButton from './components/ReloadButton'
import OverviewActions from './components/OverviewActions'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { DetailsPanelEntityData, OperationResponseModel } from '@shared/api'
import useExpandAndSelectNewFolders from './hooks/useExpandAndSelectNewFolders'
import { QueryFilter } from '@shared/containers/ProjectTreeTable/types/operations'
import DetailsPanelSplitter from '@components/DetailsPanelSplitter'
import useGoToEntity from '../../hooks/useGoToEntity'
import ImportDialogButton from '@containers/ImportDialog/ImportDialogButton'

const SCOPES = buildScopes(['task', 'folder'])

const GroupByDropdown = styled(SortingDropdown)<{
  $disableSortOrder?: boolean
}>`
  flex-shrink: 0;

  /* hide the empty placeholder container (flex:1) so chip gets full space */
  .template-value > div:has(.placeholder) {
    display: none;
  }

  .sort-chip {
    min-width: fit-content;

    ${({ $disableSortOrder }) =>
      $disableSortOrder &&
      `
      .sort-order {
        opacity: 0.5;
        cursor: not-allowed;
        pointer-events: none;
      }
    `}
  }
`

const ProjectOverviewPage: FC = () => {
  const { user } = useGlobalContext()
  const isDeveloperMode = user?.attrib?.developerMode ?? false

  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const {
    projectName,
    projectInfo,
    setQueryFilters,
    displayFilters,
    showHierarchy,
    viewGroupBy,
    viewGroupByDesc,
    updateViewGroupBy,
    tasksMap,
    updateExpanded,
  } = useProjectOverviewContext()

  const { sorting, updateSorting } = useColumnSettingsContext()
  const nameSortDesc = sorting?.[0]?.id === 'name' ? sorting[0].desc : false

  // Build group-by dropdown options
  const groupedFields = useGetGroupedFields({ scope: 'task' })
  const viewGroupByOptions = useMemo(() => {
    return [
      { id: 'hierarchy', label: 'Hierarchy', icon: 'account_tree', sortOrder: true },
      { id: 'folder', label: 'Folder', icon: 'folder', sortOrder: true },
      ...groupedFields.map((field) => ({
        id: field.value,
        label: field.label,
        icon: field.icon,
        sortOrder: true,
      })),
    ]
  }, [groupedFields])

  const viewGroupByValue = useMemo(() => {
    // undefined = view settings not loaded yet — keep dropdown empty so the
    // user doesn't see a "Hierarchy" default flicker before the saved value arrives.
    if (viewGroupBy === undefined) return []
    return viewGroupByOptions
      .filter((o) => o.id === (viewGroupBy === 'none' ? undefined : viewGroupBy ?? 'hierarchy'))
      .map((o) => ({
        ...o,
        sortOrder: o.id === 'folder' || o.id === 'hierarchy' ? !nameSortDesc : !viewGroupByDesc,
      }))
  }, [viewGroupBy, viewGroupByOptions, viewGroupByDesc, nameSortDesc])

  const handleViewGroupByChange = (values: { id: string; sortOrder?: boolean }[]) => {
    const value = values[0]
    if (!value) {
      // X clicked — flat list (no grouping)
      updateViewGroupBy('none')
      return
    }
    const desc = value.sortOrder === false
    if (value.id === 'hierarchy' || value.id === 'folder') {
      const targetView = value.id === 'hierarchy' ? null : 'folder'
      if (viewGroupBy === targetView) {
        if (desc !== nameSortDesc) {
          updateSorting([{ id: 'name', desc }])
        }
        return
      }
      updateViewGroupBy(targetView)
      return
    }
    // sortOrder: true = ascending, desc: false = ascending
    updateViewGroupBy(value.id, desc)
  }

  const { isPanelOpen } = useSettingsPanel()
  //   table contexts
  const { setSelectedCells } = useSelectionCellsContext()

  // load slicer remote config
  const { config, sliceType, setPersistentRowSelectionData, ...slicer } = useSlicerContext()
  const overviewSliceFields = config?.overview?.fields

  const handleFiltersChange = (newQueryFilters: QueryFilter) => {
    // Update the stored QueryFilter directly
    setQueryFilters(newQueryFilters)

    // check if we need to clear hierarchy selection
    // This is a simplified check - you might need to implement QueryFilter inspection
    // to determine if hierarchy filter is present
    if (
      !newQueryFilters.conditions?.some(
        (condition) => 'key' in condition && condition.key === 'hierarchy',
      )
    ) {
      setPersistentRowSelectionData({})
    }
  }

  const expandAndSelectNewFolders = useExpandAndSelectNewFolders()

  // select new entities and expand their parents
  const handleNewEntities = (ops: OperationResponseModel[], stayOpen: boolean) => {
    // expands to newly created folders and selects them
    expandAndSelectNewFolders(ops, { enableSelect: !stayOpen, enableExpand: true })
  }

  const { getGoToEntityData } = useGoToEntity()

  // select the entity in the table and expand its parent folders
  const handleUriOpen = (entity: DetailsPanelEntityData, source: 'uri' | 'url') => {
    console.debug('URI found, selecting and expanding folders to entity:', entity.name)

    // Get the data needed to navigate to this entity
    const data = getGoToEntityData(entity.id, entity.entityType as any, {
      folder: entity.folder?.id,
    })

    // Only reset view state
    if (source === 'uri') {
      setQueryFilters({})
      updateViewGroupBy(null) // switches to hierarchy and syncs groupBy in one server call
    }

    // Expand folders in both table and slicer
    updateExpanded(data.expandedFolders)
    slicer.setExpanded(data.expandedFolders)
    slicer.setRowSelection(data.selectedFolders)

    // Select the entity in the table
    setSelectedCells(
      new Set([
        getCellId(data.entityId, 'name'),
        getCellId(data.entityId, ROW_SELECTION_COLUMN_ID),
      ]),
    )
  }

  return (
    <main style={{ gap: 4 }}>
      <Splitter
        layout="horizontal"
        style={{ width: '100%', height: '100%' }}
        stateKey="overview-splitter-table"
        stateStorage="local"
      >
        <SplitterPanel size={12} minSize={2} style={{ maxWidth: 600 }}>
          <Section wrap>
            <Slicer
              sliceFields={overviewSliceFields}
              entityTypes={['task', 'folder']}
              persistFieldId="hierarchy"
            />
          </Section>
        </SplitterPanel>
        <SplitterPanel size={88}>
          <Section wrap direction="column" style={{ height: '100%' }}>
            <Toolbar>
              <NewEntity disabled={!showHierarchy} onNewEntities={handleNewEntities} />
              <OverviewActions />
              <SearchFilterWrapper
                queryFilters={displayFilters}
                onChange={handleFiltersChange}
                scopes={SCOPES}
                projectNames={projectName ? [projectName] : []}
                projectInfo={projectInfo}
                tasksMap={tasksMap}
                disabledFilters={sliceType ? [sliceType] : []}
                data={{}}
              />
              <ReloadButton />
              <GroupByDropdown
                title="Group by"
                options={viewGroupByOptions}
                value={viewGroupByValue}
                onChange={handleViewGroupByChange}
                multiSelect={false}
              />
              <ImportDialogButton importContext="hierarchy" projectName={projectName} />
              <Actions
                entities={[]}
                entityType={undefined}
                isLoadingEntity={false}
                projectActionsProjectName={projectName}
                onNavigate={navigate}
                onSetSearchParams={setSearchParams}
                searchParams={searchParams}
                isDeveloperMode={isDeveloperMode}
                align="right"
              />
              <CustomizeButton />
            </Toolbar>
            <Splitter
              layout="horizontal"
              stateKey="overview-splitter-settings"
              stateStorage="local"
              style={{ width: '100%', height: '100%', overflow: 'hidden' }}
              gutterSize={!isPanelOpen ? 0 : 4}
            >
              <SplitterPanel size={82}>
                <DetailsPanelSplitter
                  layout="horizontal"
                  stateKey="overview-splitter-details"
                  stateStorage="local"
                  style={{ width: '100%', height: '100%' }}
                >
                  <SplitterPanel size={70}>
                    <ProjectOverviewTable />
                  </SplitterPanel>

                  <SplitterPanel
                    size={30}
                    style={{
                      zIndex: 300,
                      minWidth: 300,
                    }}
                    className="details"
                  >
                    <ProjectOverviewDetailsPanel
                      projectInfo={projectInfo}
                      projectName={projectName}
                      onUriOpen={handleUriOpen}
                    />
                  </SplitterPanel>
                </DetailsPanelSplitter>
              </SplitterPanel>
              {isPanelOpen ? (
                <SplitterPanel
                  size={18}
                  style={{
                    zIndex: 500,
                  }}
                >
                  <ProjectOverviewSettings />
                </SplitterPanel>
              ) : (
                <SplitterPanel style={{ maxWidth: 0 }}></SplitterPanel>
              )}
            </Splitter>
          </Section>
        </SplitterPanel>
      </Splitter>
    </main>
  )
}

export default ProjectOverviewPage

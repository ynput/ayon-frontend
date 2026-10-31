// The stage: the selected contribution where AYON shows it. AYON's own surfaces where they live
// in @ynput/ayon-frontend-shared (details panel, slicer, Customize panel, the addon columns' cells
// and data); plain stand-ins for what lives in the ayon-frontend app (the header, the project
// list, the table around the columns). Pages render alone, without AYON's page tabs.
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Button } from '@ynput/ayon-react-components'
import { ContributionView, runContribution, useContributions } from '@ynput/ayon-addon'
import type {
  AnyContribution,
  Contribution,
  EntityRef,
  TableShortcutContext,
} from '@ynput/ayon-addon'
import { getHost, getRegistry } from '@ynput/ayon-addon/host'
import { useGetProjectQuery, useGetUsersAssigneeQuery } from '@ynput/ayon-frontend-shared/api'
import {
  EntityUpdatesProvider,
  useScopedDetailsPanel,
  useSettingsPanel,
} from '@ynput/ayon-frontend-shared/context'
import { DetailsPanel } from '@ynput/ayon-frontend-shared/DetailsPanel'
import { NewEntityProvider } from '@ynput/ayon-frontend-shared/NewEntity'
import { SlicerProvider, useSlicerContext } from '@ynput/ayon-frontend-shared/Slicer'
import { ViewsProvider } from '@ynput/ayon-frontend-shared/Views'
import { useDispatch } from 'react-redux'
import {
  AddonDialog,
  SettingsPanel,
  SlicerHost,
  useAddonCustomizeSections,
  useAddonTableShortcuts,
  shortcutEntities,
  useProjectPageSlotContext,
  useStudioPageSlotContext,
} from '@ynput/ayon-frontend-shared/components'
import { StudioSelectionProvider } from './host'
import { needsProject } from './slotNeeds'
import { ButtonItem } from './parts'
import { PreviewStage } from './PreviewStage'
import { ShellTable } from './ShellTable'
import { setStage } from './status'
import type { ShellSelection } from './types'

type Context = Record<string, unknown>
type StageProps = { contribution: AnyContribution; selection: ShellSelection }

const DETAILS_SCOPE = 'addon-dev'

const idOf = (contribution: AnyContribution) => (contribution as { id: string }).id

/** Reports the selected contribution's context (developer panel, `ayon-addon open`). */
const useReport = (
  contribution: AnyContribution,
  // slot contexts are interfaces (no index signature), the status page only reads them
  context: object | undefined,
  ready: boolean,
  /** menu items: Run calls `run`; or what Run does */
  run?: boolean | (() => Promise<void>),
) => {
  useEffect(() => {
    setStage({
      context: context as Context | undefined,
      ready,
      run:
        typeof run === 'function'
          ? run
          : run && context
          ? () => runContribution(contribution as never, context as never)
          : undefined,
    })
  }, [contribution, context, ready, run])
}

const Hint = ({ children }: { children: ReactNode }) => (
  <div style={{ padding: 16, color: 'var(--md-sys-color-outline)' }}>{children}</div>
)

// project.page: AYON's slicer state per page, the page decides where the slicer goes
const ProjectPageBody = ({ contribution, selection }: StageProps) => {
  const projectName = selection.projectName!
  const context = useProjectPageSlotContext(projectName)
  useReport(contribution, context, !!context.project)
  return (
    <div className="ayon-shell-body" data-shell-surface="project-page">
      <ContributionView contribution={contribution as never} context={context as never} />
    </div>
  )
}

// what ProjectPage (ayon-frontend) puts around a project page and its slicer
const ProjectPageProviders = ({
  page,
  projectName,
  viewType,
  initialSelection,
  children,
}: {
  page: string
  projectName: string
  viewType?: string
  /** rows to select in the slicer (?entities=, ayon-addon open --entities) */
  initialSelection?: string[]
  children: ReactNode
}) => {
  const dispatch = useDispatch()
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>(() =>
    Object.fromEntries((initialSelection || []).map((id) => [id, true])),
  )
  const controlled = initialSelection?.length ? { rowSelection, setRowSelection } : {}
  return (
    <ViewsProvider viewType={viewType} projectName={projectName} dispatch={dispatch}>
      <EntityUpdatesProvider projectNames={[projectName]}>
        <SlicerProvider
          {...controlled}
          page={page}
          projectName={projectName}
          viewSettings={undefined}
          isLoadingViews={false}
          updateViewSettings={async () => {}}
        >
          {/* the slicer's "new folder" actions */}
          <NewEntityProvider>{children}</NewEntityProvider>
        </SlicerProvider>
      </EntityUpdatesProvider>
    </ViewsProvider>
  )
}

const ProjectPageStage = (props: StageProps) => (
  <ProjectPageProviders
    key={props.contribution.key}
    page={idOf(props.contribution)}
    projectName={props.selection.projectName!}
    viewType={(props.contribution as { viewType?: string }).viewType}
  >
    <ProjectPageBody {...props} />
  </ProjectPageProviders>
)

type OnChange = (selection: ShellSelection) => void

/**
 * The studio's project selection, set from the context panel; AYON's project list on a studio
 * page shows and changes the same one, as on AYON's dashboard. `ayon-addon open --project` gives
 * one project.
 */
const useStudioSelection = (selection: ShellSelection, onChange: OnChange) => {
  const { projectNames, projectName } = selection
  const names = useMemo(
    () => projectNames ?? (projectName ? [projectName] : []),
    [projectNames, projectName],
  )
  const onSelect = useCallback(
    (next: string[]) => onChange({ ...selection, projectNames: next }),
    [selection, onChange],
  )
  return useMemo(() => ({ selection: names, onSelect }), [names, onSelect])
}

// studio.page: the page with the studio's project selection
const StudioPageBody = ({
  contribution,
  selectedProjects,
}: {
  contribution: StageProps['contribution']
  selectedProjects: string[]
}) => {
  const context = useStudioPageSlotContext(selectedProjects)
  useReport(contribution, context, true)
  return (
    <div className="ayon-shell-body" data-shell-surface="studio-page">
      <ContributionView contribution={contribution as never} context={context as never} />
    </div>
  )
}

// what UserDashboardPage (ayon-frontend) puts around a studio page: WithViews, studio scoped
const StudioPageStage = ({ contribution, selection, onChange }: StageProps & { onChange: OnChange }) => {
  const dispatch = useDispatch()
  const studio = useStudioSelection(selection, onChange)
  return (
    <ViewsProvider
      key={contribution.key}
      viewType={(contribution as { viewType?: string }).viewType}
      dispatch={dispatch}
    >
      <StudioSelectionProvider value={studio}>
        <StudioPageBody contribution={contribution} selectedProjects={studio.selection} />
      </StudioSelectionProvider>
    </ViewsProvider>
  )
}

// header.item: left after the dashboard button, right before chat and inbox
const HeaderStage = ({ contribution, selection }: StageProps) => {
  const { contributions } = useContributions('header.item')
  const [context, setContext] = useState<Context>()
  useReport(contribution, context, !!context)
  const base = useMemo(() => ({ projectName: selection.projectName ?? null }), [selection.projectName])
  const sorted = (placement: 'left' | 'right') =>
    contributions
      .filter((item) => item.placement === placement)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  const item = (header: Contribution<'header.item'>) => (
    <ButtonItem
      key={header.key}
      contribution={header as unknown as AnyContribution}
      context={base}
      autoOpen={(header as unknown) === contribution}
      onContext={(header as unknown) === contribution ? setContext : undefined}
    />
  )
  return (
    <div className="ayon-shell-bar" data-shell-surface="header">
      <Button icon="home" variant="text" disabled />
      {sorted('left').map(item)}
      <span className="spacer" />
      {sorted('right').map(item)}
      <Button icon="forum" variant="text" disabled />
      <Button icon="inbox" variant="text" disabled />
    </div>
  )
}

// detailsPanel.tab and detailsPanel.menuItem: AYON's details panel for the picked entities
const DetailsPanelStage = ({ contribution, selection }: StageProps) => {
  const projectName = selection.projectName!
  const { entities, entityType = 'task' } = selection
  const { data: project } = useGetProjectQuery({ projectName })
  const { data: users = [] } = useGetUsersAssigneeQuery({ names: undefined, projectName })
  const { setTab } = useScopedDetailsPanel(DETAILS_SCOPE)
  const isTab = contribution.slot === 'detailsPanel.tab'

  // open on the addon's tab
  useEffect(() => {
    if (isTab) setTab(contribution.key as never)
    // once per contribution
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contribution.key, isTab])

  const context = useMemo<Context>(
    () =>
      isTab
        ? { projectName, entityType, entities, scope: DETAILS_SCOPE }
        : { projectName, entityType, entities },
    [isTab, projectName, entityType, entities],
  )
  useReport(contribution, context, !!project && entities.length > 0, !isTab)

  if (!entities.length) return <Hint>Pick entities in the context panel.</Hint>
  if (!project) return <Hint>Loading {projectName}…</Hint>
  return (
    <div className="ayon-shell-body" style={{ justifyContent: 'flex-end' }}>
      <div style={{ width: 'min(620px, 100%)', height: '100%' }} data-shell-surface="details-panel">
        <DetailsPanel
          isOpen
          scope={DETAILS_SCOPE}
          entityType={entityType as never}
          entities={entities.map((e) => ({ id: e.id, projectName: e.projectName }))}
          projectsInfo={{ [projectName]: project as never }}
          projectNames={[projectName]}
          tagsOptions={project.tags || []}
          projectUsers={users}
          activeProjectUsers={users}
          style={{ boxShadow: 'none' }}
        />
      </div>
    </div>
  )
}

// slicer.menuItem: AYON's slicer; the items are in its right-click menu and dropdown
const SlicerBody = ({ contribution, selection }: StageProps) => {
  const { rowSelection, sliceType } = useSlicerContext()
  const context = useMemo(() => {
    const ids = Object.keys(rowSelection).filter((id) => rowSelection[id])
    // hierarchy rows are folders and tasks: the picked entities, else folders
    const entities =
      sliceType === 'hierarchy'
        ? ids.map(
            (id) =>
              selection.entities.find((entity) => entity.id === id) ?? {
                id,
                entityType: 'folder',
                projectName: selection.projectName!,
              },
          )
        : []
    return {
      projectName: selection.projectName,
      sliceType,
      selected: ids.map((id) => ({ id })),
      entities,
      menu: 'context',
    }
  }, [selection.projectName, selection.entities, sliceType, rowSelection])
  useReport(contribution, context, true, true)
  return (
    // positioned: the slicer's Section fills its container (a splitter panel in AYON)
    <div style={{ position: 'relative', width: 360, height: '100%' }} data-shell-surface="slicer">
      <SlicerHost fields={['hierarchy', 'assignees', 'status', 'taskType']} />
    </div>
  )
}

const SlicerStage = (props: StageProps) => (
  <div className="ayon-shell-body">
    <ProjectPageProviders
      page={`addon-dev-${idOf(props.contribution)}`}
      projectName={props.selection.projectName!}
      initialSelection={props.selection.entities.map((entity) => entity.id)}
    >
      <SlicerBody {...props} />
    </ProjectPageProviders>
  </div>
)

// projectList.menuItem: AYON's project list with its right-click menu and dropdown
const ProjectListStage = ({ contribution, selection, onChange }: StageProps & { onChange: OnChange }) => {
  const studio = useStudioSelection(selection, onChange)
  const context = useMemo(() => ({ projectNames: studio.selection, menu: 'context' }), [studio.selection])
  useReport(contribution, context, true, true)
  const { ProjectList } = getHostComponents()
  return (
    <StudioSelectionProvider value={studio}>
      <div style={{ width: 280, height: '100%' }}>
        <ProjectList multiSelect />
      </div>
    </StudioSelectionProvider>
  )
}

// the project table slots: a stand-in table with the real addon columns, menu, shortcuts, toolbar
// items and Customize panel
const TableStage = ({ contribution, selection }: StageProps) => {
  const projectName = selection.projectName!
  const page = selection.page || 'overview'
  const { entities } = selection
  const [selected, setSelected] = useState<EntityRef[]>([])
  const [popupContext, setPopupContext] = useState<Context>()
  const { contributions: toolbarItems } = useContributions('projectTable.toolbarItem')
  const sections = useAddonCustomizeSections(page)
  const { isPanelOpen, openPanel, selectSetting, closePanel } = useSettingsPanel()
  const slot = contribution.slot

  // open the Customize panel on the addon's section
  useEffect(() => {
    if (slot !== 'projectTable.customizeSection') return
    openPanel()
    selectSetting(`addon:${contribution.key}` as never)
    // once per contribution
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contribution.key, slot])

  // table.shortcut: the selected rows (else all of them) as AYON's table passes them, from the name
  // column; the keys work once the table has focus
  const shortcuts = useAddonTableShortcuts(slot === 'table.shortcut' ? page : undefined)
  const shortcutContext = useMemo<TableShortcutContext | undefined>(() => {
    const targets = selected.length ? selected : entities
    if (slot !== 'table.shortcut' || !targets.length) return undefined
    const rows = targets.map(({ id, entityType, name, label }) => ({
      id,
      entityType,
      name,
      label,
      data: { id, entityType, name, label },
    }))
    return {
      table: page,
      projectName,
      rows,
      entities: shortcutEntities(page, projectName, rows),
      focused: { rowId: rows[0].id, columnId: 'name' },
      cells: rows.map((row) => ({ rowId: row.id, columnId: 'name' })),
    }
  }, [slot, page, projectName, entities, selected])
  const { runShortcut } = shortcuts
  const pressShortcut = useMemo(
    () =>
      shortcutContext &&
      (async () =>
        runShortcut(contribution as unknown as Contribution<'table.shortcut'>, shortcutContext)),
    [runShortcut, contribution, shortcutContext],
  )

  const context = useMemo<Context | undefined>(() => {
    if (slot === 'tableColumn') return { projectName, page, entities }
    if (slot === 'entityMenuItem')
      return { projectName, page, entities: selected.length ? selected : entities }
    if (slot === 'table.shortcut') return shortcutContext as Context | undefined
    if (slot === 'projectTable.customizeSection') return { projectName, page }
    return popupContext
  }, [slot, projectName, page, entities, selected, shortcutContext, popupContext])
  useReport(contribution, context, !!context, slot === 'entityMenuItem' || pressShortcut)

  const base = useMemo(() => ({ projectName, page }), [projectName, page])
  const pageToolbarItems = toolbarItems.filter((item) => !item.pages?.length || item.pages.includes(page))

  return (
    <div className="ayon-shell-stage" style={{ flex: 1 }}>
      <div className="ayon-shell-bar" data-shell-surface="table-toolbar">
        <span>{page}</span>
        <span className="spacer" />
        {pageToolbarItems.map((item) => (
          <ButtonItem
            key={item.key}
            contribution={item as unknown as AnyContribution}
            context={base}
            autoOpen={(item as unknown) === contribution}
            onContext={(item as unknown) === contribution ? setPopupContext : undefined}
          />
        ))}
        <Button
          icon="settings"
          label="Customize"
          variant="text"
          selected={isPanelOpen}
          onClick={() => (isPanelOpen ? closePanel() : openPanel())}
        />
      </div>
      <div className="ayon-shell-body">
        <div style={{ flex: 1, overflow: 'auto' }}>
          {entities.length ? (
            <div
              tabIndex={0}
              onKeyDown={(e) => shortcuts.handleShortcut(e, () => shortcutContext)}
            >
              <ShellTable
                page={page}
                entities={entities}
                selected={selected}
                onSelect={setSelected}
              />
            </div>
          ) : (
            <Hint>Pick entities in the context panel: they are the table&apos;s rows.</Hint>
          )}
        </div>
        {isPanelOpen && (
          <div
            style={{ width: 320, borderLeft: '1px solid var(--md-sys-color-outline-variant)' }}
            data-shell-surface="customize"
          >
            <SettingsPanel settings={sections} />
          </div>
        )}
      </div>
      {shortcuts.dialog && (
        <AddonDialog contribution={shortcuts.dialog.contribution} context={shortcuts.dialog.context} />
      )}
    </div>
  )
}

// registered by the shell (host.tsx)
const getHostComponents = () =>
  getHost().components as Required<NonNullable<ReturnType<typeof getHost>['components']>>

export const Stage = ({
  mode,
  selection,
  onChange,
}: {
  mode: 'live' | 'preview'
  selection: ShellSelection
  onChange: OnChange
}) => {
  const contribution = getRegistry().contributions.find(
    (c) => c.slot === selection.slot && idOf(c) === selection.id,
  )
  useEffect(() => {
    if (!contribution) setStage({ ready: false })
  }, [contribution])

  if (!contribution) {
    return (
      <main className="ayon-shell-stage">
        <Hint>
          {selection.slot ? `No contribution "${selection.id}" in ${selection.slot}.` : 'Pick a contribution.'}
        </Hint>
      </main>
    )
  }
  if (mode === 'preview') {
    return (
      <main className="ayon-shell-stage">
        <PreviewStage contribution={contribution} selection={selection} />
      </main>
    )
  }
  if (!selection.projectName && needsProject(contribution.slot)) {
    return (
      <main className="ayon-shell-stage">
        <Hint>Pick a project in the context panel.</Hint>
      </main>
    )
  }

  const props = { contribution, selection }
  const body = (() => {
    switch (contribution.slot) {
      case 'project.page':
        return <ProjectPageStage {...props} />
      case 'studio.page':
        return <StudioPageStage {...props} onChange={onChange} />
      case 'header.item':
        return <HeaderStage {...props} />
      case 'detailsPanel.tab':
      case 'detailsPanel.menuItem':
        return <DetailsPanelStage {...props} />
      case 'slicer.menuItem':
        return <SlicerStage {...props} />
      case 'projectList.menuItem':
        return <ProjectListStage {...props} onChange={onChange} />
      case 'tableColumn':
      case 'entityMenuItem':
      case 'table.shortcut':
      case 'projectTable.toolbarItem':
      case 'projectTable.customizeSection':
        return <TableStage {...props} />
      default:
        return <Hint>The shell has no stage for {contribution.slot} yet.</Hint>
    }
  })()

  return (
    <main className="ayon-shell-stage" data-shell-slot={contribution.slot}>
      {body}
    </main>
  )
}

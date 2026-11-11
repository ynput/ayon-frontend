// The stage: the selected place with this addon's contributions where AYON shows them, rendered
// with or without a focus. AYON's own surfaces where they live in @ynput/ayon-frontend-shared
// (details panel, slicer, Customize panel, the addon columns' cells and data); plain stand-ins for
// what lives in the ayon-frontend app (the header, the table around the columns, user details,
// profile, the dashboard's layout). Pages render alone, without AYON's page tabs.
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Button, Dropdown } from '@ynput/ayon-react-components'
import { ContributionView, runContribution, useContributions, useUser } from '@ynput/ayon-addon'
import type {
  AnyContribution,
  Contribution,
  EntityRef,
  ProjectTablePage,
  ProjectTableState,
  TableShortcutContext,
} from '@ynput/ayon-addon'
import { contributionTitle, getHost } from '@ynput/ayon-addon/host'
import {
  useGetProjectQuery,
  useGetUsersAssigneeQuery,
  useGetUsersQuery,
} from '@ynput/ayon-frontend-shared/api'
import {
  EntityUpdatesProvider,
  usePowerpack,
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
  useAddonUserMenuItems,
  useUserDetailsSlotContext,
  AddonUserDetailsSections,
  AddonProfileSections,
  shortcutEntities,
  useProjectPageSlotContext,
  useStudioPageSlotContext,
} from '@ynput/ayon-frontend-shared/components'
import type { UserDetailsSource } from '@ynput/ayon-frontend-shared/components'
import { contributionsTo, findContribution, getPlace, idOf, slotSnippet } from './catalog'
import { contractSlot, getContracts, noSceneNote } from './contractModel'
import { StudioSelectionProvider } from './host'
import type { Place } from './places'
import { SceneStage } from './scenes'
import { missingInputs } from './slotNeeds'
import { FocusFrame, Placeholder, slotInfo, useSlotOverlay } from './slotOverlay'
import { ButtonItem } from './parts'
import { PreviewStage } from './PreviewStage'
import { ShellTable } from './ShellTable'
import { setStage } from './status'
import type { ShellSelection } from './types'

type Context = Record<string, unknown>
type OnChange = (selection: ShellSelection) => void
type StageProps = { selection: ShellSelection; focus?: AnyContribution; onChange: OnChange }

const DETAILS_SCOPE = 'addon-dev'

/**
 * Reports the stage to the developer panel and `ayon-addon open`: the context the focused
 * contribution gets (none without a focus), whether the stage is ready, and what Run does.
 */
const useReport = (
  focus: AnyContribution | undefined,
  // slot contexts are interfaces (no index signature), the status page only reads them
  context: object | undefined,
  ready: boolean,
  /** menu items: Run calls `run`; or what Run does */
  run?: boolean | (() => Promise<void>),
) => {
  useEffect(() => {
    setStage({
      context: focus ? (context as Context | undefined) : undefined,
      ready,
      run:
        !focus || !run
          ? undefined
          : typeof run === 'function'
          ? run
          : context
          ? () => runContribution(focus as never, context as never)
          : undefined,
    })
  }, [focus, context, ready, run])
}

const Hint = ({ children }: { children: ReactNode }) => (
  <div className="ayon-shell-hint">{children}</div>
)

/** A page's tabs: this addon's pages of the slot, the focused one (else the first) on stage. */
const PageTabs = ({
  slot,
  label,
  current,
  selection,
  onChange,
}: {
  slot: 'project.page' | 'studio.page'
  label: string
  current?: AnyContribution
  selection: ShellSelection
  onChange: OnChange
}) => {
  const pages = contributionsTo(slot)
  return (
    <div className="ayon-shell-bar" data-shell-surface="page-tabs">
      {pages.map((page) => (
        <FocusFrame key={page.key} slot={slot} contribution={page.key}>
          <Button
            label={contributionTitle(page)}
            variant="text"
            selected={page === current}
            onClick={() => onChange({ ...selection, slot: slot as never, id: idOf(page) })}
          />
        </FocusFrame>
      ))}
      <Placeholder slot={slot} label={label} />
    </div>
  )
}

// project.page: AYON's slicer state per page, the page decides where the slicer goes
const ProjectPageBody = ({ page, focus, selection }: { page: AnyContribution; focus?: AnyContribution; selection: ShellSelection }) => {
  const context = useProjectPageSlotContext(selection.projectName!)
  useReport(focus, context, !!context.project)
  return (
    <div className="ayon-shell-body" data-shell-surface="project-page">
      <ContributionView contribution={page as never} context={context as never} />
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

const ProjectPagesStage = ({ selection, focus, onChange }: StageProps) => {
  const page = focus?.slot === 'project.page' ? focus : contributionsTo('project.page')[0]
  useEffect(() => {
    if (!page) setStage({ ready: true })
  }, [page])
  return (
    <div className="ayon-shell-stage" style={{ flex: 1 }}>
      <PageTabs slot="project.page" label="Project page" current={page} selection={selection} onChange={onChange} />
      {page ? (
        <ProjectPageProviders
          key={page.key}
          page={idOf(page)}
          projectName={selection.projectName!}
          viewType={(page as { viewType?: string }).viewType}
        >
          <ProjectPageBody page={page} focus={focus} selection={selection} />
        </ProjectPageProviders>
      ) : (
        <Hint>This addon has no project pages.</Hint>
      )}
    </div>
  )
}

/**
 * The studio's project selection, set in Preview inputs; AYON's project list on a studio page
 * shows and changes the same one, as on AYON's dashboard. `ayon-addon open --project` gives one
 * project.
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
  page,
  focus,
  selectedProjects,
}: {
  page: AnyContribution
  focus?: AnyContribution
  selectedProjects: string[]
}) => {
  const context = useStudioPageSlotContext(selectedProjects)
  useReport(focus, context, true)
  return (
    <div className="ayon-shell-body" data-shell-surface="studio-page">
      <ContributionView contribution={page as never} context={context as never} />
    </div>
  )
}

// what UserDashboardPage (ayon-frontend) puts around a studio page: WithViews, studio scoped
const StudioPagesStage = ({ selection, focus, onChange }: StageProps) => {
  const dispatch = useDispatch()
  const studio = useStudioSelection(selection, onChange)
  const page = focus?.slot === 'studio.page' ? focus : contributionsTo('studio.page')[0]
  useEffect(() => {
    if (!page) setStage({ ready: true })
  }, [page])
  return (
    <div className="ayon-shell-stage" style={{ flex: 1 }}>
      <PageTabs slot="studio.page" label="Studio page" current={page} selection={selection} onChange={onChange} />
      {page ? (
        <ViewsProvider key={page.key} viewType={(page as { viewType?: string }).viewType} dispatch={dispatch}>
          <StudioSelectionProvider value={studio}>
            <StudioPageBody page={page} focus={focus} selectedProjects={studio.selection} />
          </StudioSelectionProvider>
        </ViewsProvider>
      ) : (
        <Hint>This addon has no studio pages.</Hint>
      )}
    </div>
  )
}

// app.service: mounted once by the shell (Shell.tsx), not per selection; the stage only says so
const BackgroundStage = ({ selection, focus }: StageProps) => {
  const context = useMemo(() => ({ projectName: selection.projectName ?? null }), [selection.projectName])
  useReport(focus, context, true)
  const services = contributionsTo('app.service')
  return (
    <div className="ayon-shell-no-preview" data-shell-surface="service">
      <strong>No visual preview</strong>
      <p>This service runs throughout the dev shell. Selecting it does not start or restart it.</p>
      {services.map((service) => (
        <FocusFrame key={service.key} slot="app.service" contribution={service.key}>
          <code>{idOf(service)}</code>
        </FocusFrame>
      ))}
    </div>
  )
}

// profile.section: a stand-in for Account → Profile (it lives in the ayon-frontend app), for the
// signed-in user. The slot's context has nothing besides `user`.
const PROFILE_CONTEXT = {}
const ProfileStage = ({ focus }: StageProps) => {
  const user = useUser()
  const { powerLicense, isLoading } = usePowerpack()
  const hidden =
    !!(focus as { powerFeature?: boolean } | undefined)?.powerFeature && (isLoading || !powerLicense)
  useReport(focus, PROFILE_CONTEXT, !!user && !hidden)
  if (!user) return <Hint>Signing in…</Hint>
  return (
    <div className="ayon-shell-body" style={{ justifyContent: 'center' }}>
      <div
        style={{ width: 'min(600px, 100%)', display: 'flex', flexDirection: 'column', gap: 4 }}
        data-shell-surface="profile"
      >
        <div className="ayon-shell-bar">
          <strong>{user.fullName || user.name}</strong>
          <span className="spacer" />
          <Placeholder slot="profile.section" label="Profile section" />
        </div>
        {hidden && !isLoading && (
          <Hint>Not shown with these inputs. A power feature: this section shows with a Power Pack licence only.</Hint>
        )}
        <AddonProfileSections />
      </div>
    </div>
  )
}

// userDetails.section and userDetails.menuItem: a stand-in for the user details panel of
// Settings → Users (it lives in the ayon-frontend app). The target user is picked here, apart from
// the signed-in one: with an API key that is a service user, which most sections don't show for.
const UserDetailsStage = ({ focus }: StageProps) => {
  const signedIn = useUser()
  const { data: users = [], isLoading } = useGetUsersQuery({ selfName: signedIn?.name })
  const [picked, setPicked] = useState<string>()
  // the signed-in user unless it is a service user, else the first active user
  const fallback = useMemo(
    () =>
      (users as UserDetailsSource[]).find((u) => u.name === signedIn?.name && !u.isService) ??
      (users as UserDetailsSource[]).find((u) => !u.isService && u.active !== false),
    [users, signedIn?.name],
  )
  const target = (users as UserDetailsSource[]).find((u) => u.name === picked) ?? fallback
  const selected = useMemo(() => (target ? [target] : []), [target])
  const context = useUserDetailsSlotContext(selected, false)
  useReport(focus, context, !!target, focus?.slot === 'userDetails.menuItem')
  const { topItems, items } = useAddonUserMenuItems(context)
  if (isLoading) return <Hint>Loading users…</Hint>
  if (!target) return <Hint>No users to show.</Hint>
  return (
    <div className="ayon-shell-body" style={{ justifyContent: 'flex-end' }}>
      <div
        style={{ width: 'min(420px, 100%)', display: 'flex', flexDirection: 'column', gap: 4 }}
        data-shell-surface="user-details"
      >
        <div className="ayon-shell-bar">
          <Dropdown
            value={[target.name]}
            options={(users as UserDetailsSource[]).map((u) => ({
              value: u.name,
              label: u.isService ? `${u.name} (service)` : u.attrib?.fullName || u.name,
            }))}
            search
            onChange={(names) => setPicked(names[0])}
            style={{ minWidth: 200 }}
          />
          <span className="spacer" />
          {[...topItems, ...items].map((item) => (
            <FocusFrame key={item.id} slot="userDetails.menuItem" contribution={item.id}>
              <Button
                icon={item.icon as never}
                label={item.label as string}
                variant="text"
                onClick={() => (item.onClick as () => void)?.()}
              />
            </FocusFrame>
          ))}
          <Placeholder slot="userDetails.menuItem" label="More menu item" />
        </div>
        <AddonUserDetailsSections context={context} />
        <Placeholder slot="userDetails.section" label="Section" />
      </div>
    </div>
  )
}

// header.item: left after the dashboard button, right before chat and inbox
const HeaderStage = ({ selection, focus }: StageProps) => {
  const { contributions } = useContributions('header.item')
  const [popup, setPopup] = useState<{ key: string; context: Context }>()
  const base = useMemo(() => ({ projectName: selection.projectName ?? null }), [selection.projectName])
  const focusContext = focus && popup?.key === focus.key ? popup.context : undefined
  useReport(focus, focusContext ?? base, true)
  const sorted = (placement: 'left' | 'right') =>
    contributions
      .filter((item) => item.placement === placement)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  const item = (header: Contribution<'header.item'>) => {
    const any = header as unknown as AnyContribution
    const focused = any === focus
    return (
      <FocusFrame key={`${any.key}${focused ? ':focus' : ''}`} slot="header.item" contribution={any.key}>
        <ButtonItem
          contribution={any}
          context={base}
          // focus opens its popover or dialog, as a click would
          autoOpen={focused}
          onContext={(context) => setPopup({ key: any.key, context })}
        />
      </FocusFrame>
    )
  }
  return (
    <div className="ayon-shell-bar" data-shell-surface="header">
      <Button icon="home" variant="text" disabled />
      {sorted('left').map(item)}
      <Placeholder slot="header.item" label="Header item" />
      <span className="spacer" />
      {sorted('right').map(item)}
      <Button icon="forum" variant="text" disabled />
      <Button icon="inbox" variant="text" disabled />
    </div>
  )
}

// detailsPanel.tab and detailsPanel.menuItem: AYON's details panel for the picked entities
const DetailsPanelStage = ({ selection, focus }: StageProps) => {
  const projectName = selection.projectName!
  const { entities, entityType = 'task' } = selection
  const { data: project } = useGetProjectQuery({ projectName })
  const { data: users = [] } = useGetUsersAssigneeQuery({ names: undefined, projectName })
  const { setTab } = useScopedDetailsPanel(DETAILS_SCOPE)
  const isTab = focus?.slot === 'detailsPanel.tab'

  // a focused tab opens
  useEffect(() => {
    if (isTab && focus) setTab(focus.key as never)
    // once per focus
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus?.key, isTab])

  const context = useMemo<Context>(
    () =>
      isTab
        ? { projectName, entityType, entities, scope: DETAILS_SCOPE }
        : { projectName, entityType, entities },
    [isTab, projectName, entityType, entities],
  )
  useReport(focus, context, !!project && entities.length > 0, !isTab)

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
const SlicerBody = ({ selection, focus }: StageProps) => {
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
  useReport(focus, context, true, true)
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
      page="addon-dev-slicer"
      projectName={props.selection.projectName!}
      initialSelection={props.selection.entities.map((entity) => entity.id)}
    >
      <SlicerBody {...props} />
    </ProjectPageProviders>
  </div>
)

// projectList.menuItem: AYON's project list with its right-click menu and dropdown
const ProjectListStage = ({ selection, focus, onChange }: StageProps) => {
  const studio = useStudioSelection(selection, onChange)
  const context = useMemo(() => ({ projectNames: studio.selection, menu: 'context' }), [studio.selection])
  useReport(focus, context, true, true)
  const { ProjectList } = getHostComponents()
  return (
    <StudioSelectionProvider value={studio}>
      <div style={{ width: 280, height: '100%' }}>
        <ProjectList multiSelect />
      </div>
    </StudioSelectionProvider>
  )
}

// what a column menu item gets for some of AYON's columns; `subType` groups by the page's type
const sampleColumns = (page: ProjectTablePage) => [
  { columnId: 'status', columnLabel: 'Status', groupField: 'status' },
  {
    columnId: 'subType',
    columnLabel: page === 'products' ? 'Product type' : 'Type',
    groupField: page === 'products' ? 'productType' : 'taskType',
  },
  { columnId: 'assignees', columnLabel: 'Assignees', groupField: 'assignees' },
  { columnId: 'tags', columnLabel: 'Tags', groupField: 'tags' },
  { columnId: 'updatedAt', columnLabel: 'Updated at', groupField: undefined },
]

// an unfiltered table; AYON fills it from the page's filters, slicer and grouping
const sampleTableState = (page: ProjectTablePage): ProjectTableState | undefined =>
  page === 'lists' ? undefined : { entityType: page === 'products' ? 'version' : 'task', filters: {}, showHierarchy: true }

// the project table slots: a stand-in table with the real addon columns, menu, shortcuts, toolbar
// items and Customize panel
const TableStage = ({ selection, focus }: StageProps) => {
  const projectName = selection.projectName!
  const page = selection.page || 'overview'
  const { entities } = selection
  const [selected, setSelected] = useState<EntityRef[]>([])
  const [popup, setPopup] = useState<{ key: string; context: Context }>()
  const { contributions: toolbarItems } = useContributions('projectTable.toolbarItem')
  const sections = useAddonCustomizeSections(page)
  const { isPanelOpen, openPanel, selectSetting, closePanel } = useSettingsPanel()
  // the slot in focus shows where it is (the column picker, the Customize panel); its
  // contribution, when one is in focus, is what the contexts and Run are for
  const slot = selection.slot
  const tableState = useMemo(() => sampleTableState(page), [page])

  // projectTable.columnMenuItem: the column picked in the bar; a dialog opens on Run
  const columns = useMemo(() => sampleColumns(page), [page])
  const [columnId, setColumnId] = useState(columns[0].columnId)
  const column = columns.find((c) => c.columnId === columnId) ?? columns[0]
  const [columnDialog, setColumnDialog] = useState<Context>()
  const columnContext = useMemo<Context>(
    () => ({ projectName, page, ...column, tableState }),
    [projectName, page, column, tableState],
  )
  const columnMeta = focus as unknown as { dialog?: unknown; label: string; dialogTitle?: string } | undefined
  const isColumnMenuItem = slot === 'projectTable.columnMenuItem'
  const openColumnDialog = useMemo(
    () =>
      isColumnMenuItem && columnMeta?.dialog
        ? async () => setColumnDialog({ ...columnContext, close: () => setColumnDialog(undefined) })
        : undefined,
    [isColumnMenuItem, columnMeta?.dialog, columnContext],
  )

  // the focused Customize section slot opens the panel, on the focused section if there is one
  useEffect(() => {
    if (slot !== 'projectTable.customizeSection') return
    openPanel()
    if (focus) selectSetting(`addon:${focus.key}` as never)
    // once per focus
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus?.key, slot])

  // table.shortcut: the selected rows (else all of them) as AYON's table passes them, from the name
  // column; the keys work once the table has focus
  const shortcuts = useAddonTableShortcuts(page)
  const shortcutContext = useMemo<TableShortcutContext | undefined>(() => {
    const targets = selected.length ? selected : entities
    if (!targets.length) return undefined
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
      tableState,
    }
  }, [page, projectName, entities, selected, tableState])
  const { runShortcut } = shortcuts
  const pressShortcut = useMemo(
    () =>
      slot === 'table.shortcut' && focus && shortcutContext
        ? async () => runShortcut(focus as unknown as Contribution<'table.shortcut'>, shortcutContext)
        : undefined,
    [slot, runShortcut, focus, shortcutContext],
  )

  const context = useMemo<Context | undefined>(() => {
    if (slot === 'tableColumn') return { projectName, page, entities }
    if (slot === 'entityMenuItem')
      return { projectName, page, entities: selected.length ? selected : entities, tableState }
    if (slot === 'table.shortcut') return shortcutContext as Context | undefined
    if (slot === 'projectTable.columnMenuItem') return columnContext
    if (slot === 'projectTable.customizeSection') return { projectName, page }
    return focus && popup?.key === focus.key ? popup.context : undefined
  }, [slot, focus, projectName, page, entities, selected, tableState, shortcutContext, columnContext, popup])
  useReport(
    focus,
    context,
    !focus || !!context,
    slot === 'entityMenuItem' || pressShortcut || openColumnDialog || isColumnMenuItem,
  )

  const base = useMemo(() => ({ projectName, page, tableState }), [projectName, page, tableState])
  const pageToolbarItems = toolbarItems.filter((item) => !item.pages?.length || item.pages.includes(page))

  return (
    <div className="ayon-shell-stage" style={{ flex: 1 }}>
      <div className="ayon-shell-bar" data-shell-surface="table-toolbar">
        <span>{page}</span>
        {isColumnMenuItem && (
          <Dropdown
            value={[column.columnId]}
            options={columns.map((c) => ({ value: c.columnId, label: c.columnLabel }))}
            onChange={(ids) => setColumnId(ids[0])}
            style={{ minWidth: 160 }}
          />
        )}
        <span className="spacer" />
        {pageToolbarItems.map((item) => {
          const any = item as unknown as AnyContribution
          const focused = any === focus
          return (
            <FocusFrame key={`${any.key}${focused ? ':focus' : ''}`} slot="projectTable.toolbarItem" contribution={any.key}>
              <ButtonItem
                contribution={any}
                context={base}
                autoOpen={focused}
                onContext={(popupContext) => setPopup({ key: any.key, context: popupContext })}
              />
            </FocusFrame>
          )
        })}
        <Placeholder slot="projectTable.toolbarItem" label="Toolbar item" />
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
            <div tabIndex={0} onKeyDown={(e) => shortcuts.handleShortcut(e, () => shortcutContext)}>
              <ShellTable
                page={page}
                tableState={tableState}
                entities={entities}
                selected={selected}
                onSelect={setSelected}
              />
            </div>
          ) : (
            <Hint>Choose a project and entities in Preview inputs: they are the table&apos;s rows.</Hint>
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
      {columnDialog && focus && (
        <AddonDialog
          contribution={focus as unknown as Contribution<'projectTable.columnMenuItem'>}
          context={columnDialog as never}
          title={(columnMeta?.dialogTitle || columnMeta?.label || '').replace(/\{column\}/g, () => column.columnLabel)}
        />
      )}
    </div>
  )
}

/** A slot without a preview: where it would show, and how to start a contribution to it. */
const NoPreviewSlot = ({ slot, label, description }: { slot: string; label: string; description?: string }) => {
  const overlay = useSlotOverlay()
  const contributions = contributionsTo(slot)
  const declared = contractSlot(slot)
  const snippet = contributions.length ? undefined : slotSnippet(slot)
  const [copied, setCopied] = useState(false)
  const focused = overlay.focusSlot === slot
  return (
    <section
      className={`ayon-shell-no-preview${focused ? ' focused' : ''}`}
      data-shell-slot={slot}
      ref={(element) => {
        if (focused && element) element.scrollIntoView({ block: 'nearest' })
      }}
    >
      <header>
        <strong>{label}</strong>
        <code>{slot}</code>
      </header>
      <strong>No preview available</strong>
      <p>This slot has no preview in the dev shell.</p>
      {description && <p>{description}</p>}
      {declared && <p className="ayon-shell-note">{noSceneNote(declared, getContracts().find((c) => c.package === declared.package))}</p>}
      {contributions.map((c) => (
        <FocusFrame key={c.key} slot={slot} contribution={c.key}>
          <span className="ayon-shell-chip">{contributionTitle(c)}</span>
        </FocusFrame>
      ))}
      {snippet && (
        <>
          <strong>Add a contribution</strong>
          <div className="ayon-shell-snippet">
            <pre className="ayon-shell-code">{snippet}</pre>
            <Button
              icon={copied ? 'check' : 'content_copy'}
              label="Copy"
              variant="text"
              onClick={() => {
                navigator.clipboard?.writeText(snippet).then(() => setCopied(true), () => undefined)
              }}
            />
          </div>
        </>
      )}
    </section>
  )
}

const OtherSlotsStage = ({ place, focus, slots }: { place: Place; focus?: AnyContribution; slots: Place['slots'] }) => {
  useReport(focus, undefined, true)
  return (
    <div className="ayon-shell-body ayon-shell-other" data-shell-surface="other-slots">
      {slots.map((s) => (
        <NoPreviewSlot key={s.slot} slot={s.slot} label={s.label} description={s.description ?? slotInfo(s.slot).description} />
      ))}
      {!slots.length && (
        <Hint>{place.slots.length ? 'This addon uses none of these slots.' : 'Every known slot has a preview in another place.'}</Hint>
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
  listedSlots,
  onChange,
  onOpenInputs,
}: {
  mode: 'live' | 'preview'
  selection: ShellSelection
  /** the slots "Slots here" lists (Other slots shows those) */
  listedSlots: Place['slots']
  onChange: OnChange
  onOpenInputs: () => void
}) => {
  const place = getPlace(selection.surface)
  const focus = findContribution(selection.slot, selection.id)

  if (mode === 'preview') {
    return (
      <main className="ayon-shell-stage">
        {focus ? (
          <PreviewStage contribution={focus} selection={selection} />
        ) : (
          <Hint>{`No contribution "${selection.id}" in ${selection.slot}.`}</Hint>
        )}
      </main>
    )
  }
  if (!place) return <NoPlace surface={selection.surface} />
  if (place.scene) {
    return (
      <main className="ayon-shell-stage" data-shell-scene={place.scene.key}>
        <SceneStage scene={place.scene} selection={selection} onChange={onChange} />
      </main>
    )
  }
  if (place.kind === 'other') {
    return (
      <main className="ayon-shell-stage" data-shell-place={place.id}>
        <OtherSlotsStage place={place} focus={focus} slots={listedSlots} />
      </main>
    )
  }
  if (missingInputs(place.id, selection)) {
    return (
      <main className="ayon-shell-stage" data-shell-place={place.id}>
        <NotReady />
        <Hint>
          Choose a project and entities in Preview inputs.{' '}
          <Button label="Preview inputs" variant="text" icon="tune" onClick={onOpenInputs} />
        </Hint>
      </main>
    )
  }

  const props = { selection, focus, onChange }
  const body = (() => {
    switch (place.id) {
      case 'app-header':
        return <HeaderStage {...props} />
      case 'project-pages':
        return <ProjectPagesStage {...props} />
      case 'studio-pages':
        return <StudioPagesStage {...props} />
      case 'details-panel':
        return <DetailsPanelStage {...props} />
      case 'slicer':
        return <SlicerStage {...props} />
      case 'project-list':
        return <ProjectListStage {...props} />
      case 'project-tables':
        return <TableStage {...props} />
      case 'background':
        return <BackgroundStage {...props} />
      case 'user-details':
        return <UserDetailsStage {...props} />
      case 'profile':
        return <ProfileStage {...props} />
      default:
        return <Hint>The shell has no stage for {place.label} yet.</Hint>
    }
  })()

  return (
    <main className="ayon-shell-stage" data-shell-place={place.id}>
      {body}
    </main>
  )
}

const NotReady = () => {
  useEffect(() => setStage({ ready: false }), [])
  return null
}

const NoPlace = ({ surface }: { surface?: string }) => (
  <main className="ayon-shell-stage">
    <NotReady />
    <Hint>{surface ? `No place "${surface}".` : 'Select a place.'}</Hint>
  </main>
)

// The stage: the selected place with this addon's contributions where AYON shows them, all its
// slots at once. AYON's own surfaces where they live in @ynput/ayon-frontend-shared (details
// panel, slicer, Customize panel, the addon columns' cells and data, the project list and the
// studio pages' layout); replicas of what lives in the ayon-frontend app (the header, the project
// table around the columns, the user details panel, the account page). Pages render alone, without AYON's page tabs. Each
// slot reports the context it passes (Context shows it).
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  Button,
  FormRow,
  InputSwitch,
  InputText,
  LockedInput,
  Panel,
  SaveButton,
} from '@ynput/ayon-react-components'
import { ContributionView, useContributions, useUser } from '@ynput/ayon-addon'
import type {
  AnyContribution,
  Contribution,
  EntityRef,
  ProjectTablePage,
  ProjectTableState,
  TableShortcutContext,
} from '@ynput/ayon-addon'
import { contributionTags, contributionTitle, getHost } from '@ynput/ayon-addon/host'
import {
  useGetCurrentUserQuery,
  useGetProjectQuery,
  useGetUsersAssigneeQuery,
  useGetUsersQuery,
} from '@ynput/ayon-frontend-shared/api'
import {
  EntityUpdatesProvider,
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
  UserImage,
  useAddonCustomizeSections,
  useAddonTableShortcuts,
  useAddonUserMenuItems,
  useUserDetailsSlotContext,
  AddonUserDetailsSections,
  AddonProfileSections,
  shortcutEntities,
  UserDetailsHeader,
  usersAccessLabel,
  StudioPageSelectionProvider,
  useProjectPageSlotContext,
  useStudioPageSlotContext,
} from '@ynput/ayon-frontend-shared/components'
import type { UserDetailsSource } from '@ynput/ayon-frontend-shared/components'
import { contributionsTo, findContribution, getPlace, idOf, onStage, slotSnippet } from './catalog'
import { contractSlot, getContracts, noSceneNote } from './contractModel'
import type { Place } from './places'
import { SceneStage } from './scenes'
import { missingInputs } from './slotNeeds'
import { slotInfo } from './slotOverlay'
import { ButtonItem } from './parts'
import { PreviewStage } from './PreviewStage'
import { ShellTable } from './ShellTable'
import { setStageReady, useSlotReport, useStageReady } from './status'
import type { ShellSelection } from './types'

type Context = Record<string, unknown>
type OnChange = (selection: ShellSelection) => void
type StageProps = { selection: ShellSelection; onChange: OnChange }

const DETAILS_SCOPE = 'addon-dev'

const Hint = ({ children }: { children: ReactNode }) => (
  <div className="ayon-shell-hint">{children}</div>
)

/**
 * The page shown of a page slot: picked in its tabs, the first one to start with (or the one
 * `ayon-addon open` is about).
 */
const usePage = (slot: 'project.page' | 'studio.page', selection: ShellSelection) => {
  const pages = onStage(slot)
  const opened = selection.slot === slot ? findContribution(slot, selection.id) : undefined
  const [picked, setPicked] = useState(opened?.key)
  return { pages, page: pages.find((p) => p.key === picked) ?? pages[0], pick: setPicked }
}

/** A page slot's tabs: this addon's pages of the slot, the picked one on stage. */
const PageTabs = ({
  pages,
  current,
  onPick,
}: {
  pages: AnyContribution[]
  current?: AnyContribution
  onPick: (key: string) => void
}) => (
  <div className="ayon-shell-bar" data-shell-surface="page-tabs">
    {pages.map((page) => (
      <Button
        key={page.key}
        label={contributionTitle(page)}
        variant="text"
        selected={page === current}
        onClick={() => onPick(page.key)}
        {...contributionTags(page)}
      />
    ))}
  </div>
)

// project.page: AYON's slicer state per page, the page decides where the slicer goes
const ProjectPageBody = ({ page, selection }: { page: AnyContribution; selection: ShellSelection }) => {
  const context = useProjectPageSlotContext(selection.projectName!)
  useSlotReport('project.page', context)
  useStageReady(!!context.project)
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

const ProjectPagesStage = ({ selection }: StageProps) => {
  const { pages, page, pick } = usePage('project.page', selection)
  useEffect(() => {
    if (!page) setStageReady(true)
  }, [page])
  return (
    <div className="ayon-shell-stage" style={{ flex: 1 }}>
      <PageTabs pages={pages} current={page} onPick={pick} />
      {page ? (
        <ProjectPageProviders
          key={page.key}
          page={idOf(page)}
          projectName={selection.projectName!}
          viewType={(page as { viewType?: string }).viewType}
        >
          <ProjectPageBody page={page} selection={selection} />
        </ProjectPageProviders>
      ) : (
        <Hint>This addon has no project pages.</Hint>
      )}
    </div>
  )
}

/**
 * The studio's project selection, set in Context; AYON's project list on a studio page
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
const StudioPageBody = ({ page, selectedProjects }: { page: AnyContribution; selectedProjects: string[] }) => {
  const context = useStudioPageSlotContext(selectedProjects)
  useSlotReport('studio.page', context)
  useStageReady(true)
  return (
    <div className="ayon-shell-body" data-shell-surface="studio-page">
      <ContributionView contribution={page as never} context={context as never} />
    </div>
  )
}

// what UserDashboardPage (ayon-frontend) puts around a studio page: WithViews, studio scoped
const StudioPagesStage = ({ selection, onChange }: StageProps) => {
  const dispatch = useDispatch()
  const studio = useStudioSelection(selection, onChange)
  const { pages, page, pick } = usePage('studio.page', selection)
  useEffect(() => {
    if (!page) setStageReady(true)
  }, [page])
  return (
    <div className="ayon-shell-stage" style={{ flex: 1 }}>
      <PageTabs pages={pages} current={page} onPick={pick} />
      {page ? (
        <ViewsProvider key={page.key} viewType={(page as { viewType?: string }).viewType} dispatch={dispatch}>
          <StudioPageSelectionProvider value={studio}>
            <StudioPageBody page={page} selectedProjects={studio.selection} />
          </StudioPageSelectionProvider>
        </ViewsProvider>
      ) : (
        <Hint>This addon has no studio pages.</Hint>
      )}
    </div>
  )
}

// app.service: mounted once by the shell (Shell.tsx), not per selection; the stage only says so
const BackgroundStage = ({ selection }: StageProps) => {
  const context = useMemo(() => ({ projectName: selection.projectName ?? null }), [selection.projectName])
  useSlotReport('app.service', context)
  useStageReady(true)
  const services = onStage('app.service')
  return (
    <div className="ayon-shell-no-preview" data-shell-surface="service">
      <strong>No visual preview</strong>
      <p>This service runs throughout the dev shell. Opening this place does not start or restart it.</p>
      {services.map((service) => (
        <code key={service.key} {...contributionTags(service)}>
          {idOf(service)}
        </code>
      ))}
    </div>
  )
}

// profile.section: a replica of Account > Profile (ProfilePage in the ayon-frontend app) for the
// signed-in user: AYON's tabs, the avatar and name, the profile card, and the addon sections next
// to it. The form shows the user's values and saves nothing. The slot's context has nothing
// besides `user`.
const PROFILE_CONTEXT = {}
const AccountStage = () => {
  const user = useUser()
  const { data: current } = useGetCurrentUserQuery()
  const full = current as
    | { name: string; attrib?: { fullName?: string; email?: string }; data?: { disablePasswordLogin?: boolean; frontendPreferences?: { notifications?: boolean; notificationSound?: boolean } } }
    | undefined
  useSlotReport('profile.section', user ? PROFILE_CONTEXT : undefined)
  useStageReady(!!user)
  if (!user || !full) return <Hint>Signing in…</Hint>
  const preferences = full.data?.frontendPreferences
  return (
    <div className="ayon-shell-stage" style={{ flex: 1 }} data-shell-surface="account">
      {/* AYON's account tabs (AppNavLinks) */}
      <nav className="ayon-shell-nav-links">
        <span className="selected">Profile</span>
        <span>Sessions</span>
        <span>Launchers</span>
      </nav>
      <div className="ayon-shell-account">
        <div className="ayon-shell-account-forms">
          <UserImage name={full.name} fullName={full.attrib?.fullName || undefined} size={100} className="ayon-shell-account-avatar" />
          <span className="ayon-shell-account-name">{full.attrib?.fullName || full.name}</span>
          <div className="ayon-shell-account-columns">
            <Panel>
              <header className="ayon-shell-card-header">
                <b>Profile</b>
                <SaveButton label="Save profile" active={false} style={{ marginLeft: 'auto' }} />
              </header>
              <FormRow label="Username">
                <InputText value={full.name} disabled />
              </FormRow>
              <FormRow label="Full name">
                <InputText value={full.attrib?.fullName || ''} readOnly />
              </FormRow>
              <FormRow label="Email">
                <InputText value={full.attrib?.email || ''} readOnly />
              </FormRow>
              {!full.data?.disablePasswordLogin && (
                <FormRow label="Password">
                  <LockedInput label="Password" value="randompasswor" type="password" onEdit={() => undefined} />
                </FormRow>
              )}
              <hr className="ayon-shell-divider" />
              <FormRow label="Desktop notifications">
                <InputSwitch checked={!!preferences?.notifications} readOnly />
              </FormRow>
              <FormRow label="Notification sound">
                <InputSwitch checked={!!preferences?.notificationSound} readOnly />
              </FormRow>
            </Panel>
            <div className="ayon-shell-account-side">
              <AddonProfileSections />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

type ShellUser = UserDetailsSource & {
  accessGroups?: Record<string, string[]>
}

/** The user's level as Settings > Users shows it. */
const userLevel = (user: ShellUser) =>
  user.isAdmin ? 'admin' : user.isService ? 'service' : user.isManager ? 'manager' : 'user'

// userDetails.section and userDetails.menuItem: a replica of the user details panel of Settings >
// Users (UserDetail in the ayon-frontend app), next to a list of the users to pick from (also in
// Context). AYON's header (shared) and the addon sections: AYON's own forms are left out.
const UserDetailsStage = ({ selection, onChange }: StageProps) => {
  const signedIn = useUser()
  const { data = [], isLoading } = useGetUsersQuery({ selfName: signedIn?.name })
  const users = data as ShellUser[]
  // the signed-in user unless it is a service user (an API key), else the first active user
  const fallback = useMemo(
    () =>
      users.find((u) => u.name === signedIn?.name && !u.isService) ?? users.find((u) => !u.isService && u.active !== false),
    [users, signedIn?.name],
  )
  const target = users.find((u) => u.name === selection.userName) ?? fallback
  const selected = useMemo(() => (target ? [target] : []), [target])
  const context = useUserDetailsSlotContext(selected, false)
  useSlotReport('userDetails.section', target ? context : undefined)
  useSlotReport('userDetails.menuItem', target ? context : undefined)
  useStageReady(!!target)
  const addonMenu = useAddonUserMenuItems(context)
  // tagged for the slot inspector (the shared hook)
  const menuItems = [
    ...addonMenu.topItems,
    ...addonMenu.items,
    { id: 'delete', label: 'Delete user', icon: 'delete', danger: true, disabled: true },
  ]
  if (isLoading) return <Hint>Loading users…</Hint>
  if (!target) return <Hint>No users to show.</Hint>
  return (
    <div className="ayon-shell-body ayon-shell-users" data-shell-surface="user-details">
      <table className="ayon-shell-table ayon-shell-users-list">
        <thead>
          <tr>
            <th className="ayon-shell-th">
              <div className="ayon-shell-th-content">Name</div>
            </th>
            <th className="ayon-shell-th">
              <div className="ayon-shell-th-content">Full name</div>
            </th>
            <th className="ayon-shell-th">
              <div className="ayon-shell-th-content">Level</div>
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr
              key={u.name}
              className={u.name === target.name ? 'selected' : undefined}
              onClick={() => onChange({ ...selection, userName: u.name })}
            >
              <td>
                <div className="ayon-shell-td-content">{u.name}</div>
              </td>
              <td>
                <div className="ayon-shell-td-content">{u.attrib?.fullName}</div>
              </td>
              <td>
                <div className="ayon-shell-td-content">{userLevel(u)}</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <section className="ayon-shell-user-detail">
        <UserDetailsHeader
          users={selected}
          subTitle={usersAccessLabel(selected)}
          menuItems={menuItems}
          onMenuOpen={addonMenu.prefetch}
        />
        <div className="ayon-shell-user-forms">
          <AddonUserDetailsSections context={context} />
        </div>
        <Panel className="ayon-shell-panel-buttons">
          <Button label="Cancel" icon="close" disabled />
          <SaveButton label="Save selected users" active disabled />
        </Panel>
      </section>
    </div>
  )
}

// header.item: left after the dashboard button, right before chat and inbox
const HeaderStage = ({ selection }: StageProps) => {
  const { contributions } = useContributions('header.item')
  // an item's popover or dialog passes its own context, once it opens
  const [popup, setPopup] = useState<Context>()
  const base = useMemo(() => ({ projectName: selection.projectName ?? null }), [selection.projectName])
  useSlotReport('header.item', popup ?? base)
  useStageReady(true)
  const sorted = (placement: 'left' | 'right') =>
    contributions
      .filter((item) => item.placement === placement)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  const item = (header: Contribution<'header.item'>) => {
    const any = header as unknown as AnyContribution
    return (
      <ButtonItem key={any.key} contribution={any} context={base} onContext={setPopup} />
    )
  }
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
const DetailsPanelStage = ({ selection }: StageProps) => {
  const projectName = selection.projectName!
  const { entities, entityType = 'task' } = selection
  const { data: project } = useGetProjectQuery({ projectName })
  const { data: users = [] } = useGetUsersAssigneeQuery({ names: undefined, projectName })

  const menuContext = useMemo<Context>(() => ({ projectName, entityType, entities }), [projectName, entityType, entities])
  const tabContext = useMemo<Context>(() => ({ ...menuContext, scope: DETAILS_SCOPE }), [menuContext])
  useSlotReport('detailsPanel.tab', tabContext)
  useSlotReport('detailsPanel.menuItem', menuContext)
  useStageReady(!!project && entities.length > 0)

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
const SlicerBody = ({ selection }: StageProps) => {
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
  useSlotReport('slicer.menuItem', context)
  useStageReady(true)
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
const ProjectListStage = ({ selection, onChange }: StageProps) => {
  const studio = useStudioSelection(selection, onChange)
  const context = useMemo(() => ({ projectNames: studio.selection, menu: 'context' }), [studio.selection])
  useSlotReport('projectList.menuItem', context)
  useStageReady(true)
  const { ProjectList } = getHostComponents()
  return (
    <StudioPageSelectionProvider value={studio}>
      <div style={{ width: 280, height: '100%' }}>
        <ProjectList multiSelect />
      </div>
    </StudioPageSelectionProvider>
  )
}

// an unfiltered table; AYON fills it from the page's filters, slicer and grouping
const sampleTableState = (page: ProjectTablePage): ProjectTableState | undefined =>
  page === 'lists' ? undefined : { entityType: page === 'products' ? 'version' : 'task', filters: {}, showHierarchy: true }

// the project table slots: AYON's table (shared) with the addon columns, column menus, right-click
// menu and shortcuts, and a replica of its toolbar items and Customize panel
const TableStage = ({ selection }: StageProps) => {
  const projectName = selection.projectName!
  const page = selection.page || 'overview'
  const { entities } = selection
  const [selected, setSelected] = useState<EntityRef[]>([])
  const [popup, setPopup] = useState<Context>()
  const { contributions: toolbarItems } = useContributions('projectTable.toolbarItem')
  const sections = useAddonCustomizeSections(page)
  const { isPanelOpen, openPanel, closePanel } = useSettingsPanel()
  const tableState = useMemo(() => sampleTableState(page), [page])

  // table.shortcut: the selected rows (else all of them) as AYON's table passes them, from the name
  // column, for running one from the developer panel (the table handles the keys itself)
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
  const pressShortcut = useCallback(
    async (contribution: AnyContribution) => {
      if (shortcutContext) await runShortcut(contribution as unknown as Contribution<'table.shortcut'>, shortcutContext)
    },
    [runShortcut, shortcutContext],
  )

  const base = useMemo(() => ({ projectName, page, tableState }), [projectName, page, tableState])
  const columnContext = useMemo(() => ({ projectName, page, entities }), [projectName, page, entities])
  const menuContext = useMemo(
    () => ({ projectName, page, entities: selected.length ? selected : entities, tableState }),
    [projectName, page, entities, selected, tableState],
  )
  const customizeContext = useMemo(() => ({ projectName, page }), [projectName, page])
  useSlotReport('tableColumn', columnContext)
  useSlotReport('entityMenuItem', menuContext)
  useSlotReport('table.shortcut', shortcutContext, pressShortcut)
  useSlotReport('projectTable.toolbarItem', popup ?? base)
  useSlotReport('projectTable.customizeSection', customizeContext)
  useStageReady(true)

  const pageToolbarItems = toolbarItems.filter((item) => !item.pages?.length || item.pages.includes(page))

  return (
    <div className="ayon-shell-stage" style={{ flex: 1 }}>
      <div className="ayon-shell-bar" data-shell-surface="table-toolbar">
        <span className="ayon-shell-bar-title">{page}</span>
        <span className="spacer" />
        {pageToolbarItems.map((item) => {
          const any = item as unknown as AnyContribution
          return (
            <ButtonItem key={any.key} contribution={any} context={base} onContext={setPopup} />
          )
        })}
        <Button
          icon="settings"
          label="Customize"
          variant="text"
          selected={isPanelOpen}
          onClick={() => (isPanelOpen ? closePanel() : openPanel())}
        />
      </div>
      <div className="ayon-shell-body">
        <div className="ayon-shell-table-scroll">
          {entities.length ? (
            <ShellTable page={page} tableState={tableState} entities={entities} onSelect={setSelected} />
          ) : (
            <Hint>Choose a project and entities in Context: they are the table&apos;s rows.</Hint>
          )}
        </div>
        {isPanelOpen && (
          <div className="ayon-shell-customize" data-shell-surface="customize">
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

/** A slot without a preview: where it would show, and how to start a contribution to it. */
const NoPreviewSlot = ({ slot, label, description }: { slot: string; label: string; description?: string }) => {
  const contributions = contributionsTo(slot)
  const declared = contractSlot(slot)
  const snippet = contributions.length ? undefined : slotSnippet(slot)
  const [copied, setCopied] = useState(false)
  return (
    <section className="ayon-shell-no-preview" data-shell-slot={slot}>
      <header>
        <strong>{label}</strong>
        <code>{slot}</code>
      </header>
      <strong>No preview available</strong>
      <p>This slot has no preview in the dev shell.</p>
      {description && <p>{description}</p>}
      {declared && <p className="ayon-shell-note">{noSceneNote(declared, getContracts().find((c) => c.package === declared.package))}</p>}
      {contributions.map((c) => (
        <span key={c.key} className="ayon-shell-chip" {...contributionTags(c)}>
          {contributionTitle(c)}
        </span>
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

const OtherSlotsStage = ({ place, slots }: { place: Place; slots: Place['slots'] }) => {
  useStageReady(true)
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
  /** the slots the panel's Slots list shows (Other slots shows those) */
  listedSlots: Place['slots']
  onChange: OnChange
  onOpenInputs: () => void
}) => {
  const place = getPlace(selection.surface)

  if (mode === 'preview') {
    // the fixture's contribution
    const contribution = findContribution(selection.slot, selection.id)
    return (
      <main className="ayon-shell-stage">
        {contribution ? (
          <PreviewStage contribution={contribution} selection={selection} />
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
        <OtherSlotsStage place={place} slots={listedSlots} />
      </main>
    )
  }
  if (missingInputs(place.id, selection)) {
    return (
      <main className="ayon-shell-stage" data-shell-place={place.id}>
        <NotReady />
        <Hint>
          Choose a project and entities in Context.{' '}
          <Button label="Context" variant="text" icon="tune" onClick={onOpenInputs} />
        </Hint>
      </main>
    )
  }

  const props = { selection, onChange }
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
      case 'account':
        return <AccountStage />
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
  useStageReady(false)
  return null
}

const NoPlace = ({ surface }: { surface?: string }) => (
  <main className="ayon-shell-stage">
    <NotReady />
    <Hint>{surface ? `No place "${surface}".` : 'Select a place.'}</Hint>
  </main>
)

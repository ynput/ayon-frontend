// The standalone dev shell: the addon's contributions in AYON's real providers and surfaces,
// signed in to a real server (live) or answering from fixtures (preview), with a developer panel.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Provider } from 'react-redux'
import {
  BrowserRouter,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import { QueryParamProvider } from 'use-query-params'
import { ReactRouter6Adapter } from 'use-query-params/adapters/react-router-6'
import { Splitter, SplitterPanel } from 'primereact/splitter'
import { createStandaloneStore, useGetCurrentUserQuery, useListProjectsQuery } from '@ynput/ayon-frontend-shared/api'
import {
  DeleteEntitiesProvider,
  DetailsPanelProvider,
  GlobalProvider,
  MenuProvider,
  PiPProvider,
  PowerpackProvider,
  ProjectContextProvider,
  ProjectFoldersContextProvider,
  SettingsPanelProvider,
  URIProvider,
} from '@ynput/ayon-frontend-shared/context'
import { ContextMenuProvider, GlobalContextMenu } from '@ynput/ayon-frontend-shared/ContextMenu'
import { ProjectDataProvider } from '@ynput/ayon-frontend-shared/ProjectTreeTable'
import { AddonServices, LoginPage, setSlotHighlight, SplitterStyles } from '@ynput/ayon-frontend-shared/components'
import { storeAccessToken } from '@ynput/ayon-frontend-shared/util'
import { useDispatch } from 'react-redux'
import { DevPanel, slotsHere } from './DevPanel'
import { Stage } from './Stage'
import { StageHeader } from './StageHeader'
import { StageBoundary } from './StageBoundary'
import { PreviewInputs } from './PreviewInputs'
import { clearMenus, setStatus } from './status'
import type { ShellOptions, ShellSelection } from './types'
import { navigationKey, readSelection, rememberSceneValues, writeSelection } from './params'
import { provideHost } from '@ynput/ayon-addon/host'
import { getShellUser } from './host'
import { getPlace, getPlaces, getUsedSlots } from './catalog'
import { listedPlaces } from './places'

const Centered = ({ children }: { children: ReactNode }) => (
  <div style={{ display: 'grid', placeItems: 'center', height: '100%' }}>{children}</div>
)

// live: the user of the API key the dev server sends, or the login page (like AYON's)
const SignedIn = ({ options, children }: { options: ShellOptions; children: ReactNode }) => {
  // a stored token the server rejects was dropped before this (startShell)
  const { data: user, error, isLoading, refetch } = useGetCurrentUserQuery()
  if (isLoading) return <Centered>Connecting to {options.serverUrl}…</Centered>
  if (!user) {
    const status = (error as { status?: number } | undefined)?.status
    if (status === 401 || status === 403) {
      return (
        <LoginPage
          onLogin={(result) => {
            if (result.accessToken) storeAccessToken(result.accessToken)
            refetch()
          }}
        />
      )
    }
    return (
      <Centered>
        <div role="alert" className="ayon-addon-error">
          Can&apos;t reach AYON at {options.serverUrl} ({status ?? 'no answer'}). Set AYON_SERVER_URL.
        </div>
      </Centered>
    )
  }
  return <>{children}</>
}

// what the app around AYON's pages provides (src/app.tsx), as far as shared surfaces need it
const AppProviders = ({ children }: { children: ReactNode }) => {
  const dispatch = useDispatch()
  const { data: user } = useGetCurrentUserQuery()
  return (
    <GlobalProvider>
      <PowerpackProvider>
        <ContextMenuProvider>
          <GlobalContextMenu />
          <MenuProvider useNavigate={useNavigate}>
            <URIProvider>
              <DetailsPanelProvider
                user={user as never}
                dispatch={dispatch}
                useLocation={useLocation}
                useNavigate={useNavigate}
                useParams={useParams}
                useSearchParams={useSearchParams}
              >
                <PiPProvider>
                  <DeleteEntitiesProvider>
                    <SettingsPanelProvider>{children}</SettingsPanelProvider>
                  </DeleteEntitiesProvider>
                </PiPProvider>
              </DetailsPanelProvider>
            </URIProvider>
          </MenuProvider>
        </ContextMenuProvider>
      </PowerpackProvider>
    </GlobalProvider>
  )
}

const ProjectProviders = ({
  projectName,
  light,
  children,
}: {
  projectName?: string
  /** preview: only the project (the addon columns read it), not its folders and attributes */
  light?: boolean
  children: ReactNode
}) =>
  projectName && light ? (
    <ProjectContextProvider projectName={projectName}>{children}</ProjectContextProvider>
  ) : projectName ? (
    <ProjectContextProvider projectName={projectName}>
      <ProjectFoldersContextProvider projectName={projectName}>
        <ProjectDataProvider projectName={projectName}>{children}</ProjectDataProvider>
      </ProjectFoldersContextProvider>
    </ProjectContextProvider>
  ) : (
    <>{children}</>
  )

// the panels' open state, a viewer convenience only
const INPUTS_OPEN = 'ayon-addon-shell-inputs'
const LEFT_OPEN = 'ayon-addon-shell-left'
const readOpen = (key: string, fallback: boolean) => {
  try {
    const stored = localStorage.getItem(key)
    return stored === null ? fallback : stored === '1'
  } catch {
    return fallback
  }
}
const useStoredToggle = (key: string, fallback: boolean) => {
  const [open, setOpen] = useState(() => readOpen(key, fallback))
  const toggle = useCallback(
    (next?: boolean) =>
      setOpen((current) => {
        const value = next ?? !current
        try {
          localStorage.setItem(key, value ? '1' : '0')
        } catch {
          // a viewer convenience only
        }
        return value
      }),
    [key],
  )
  return [open, toggle] as const
}

/** Whether a key press goes to a field: then it is typing, not a shortcut. */
const isTyping = (target: EventTarget | null) => {
  const element = target as HTMLElement | null
  if (!element) return false
  return (
    element.isContentEditable ||
    ['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName) ||
    !!element.closest?.('[contenteditable=""], [contenteditable="true"]')
  )
}

/** The selection in the URL; without a place, the first one this addon uses. */
const initialSelection = () => {
  const selection = readSelection(window.location.search, getPlaces())
  if (selection.surface) return selection
  const first = listedPlaces(getPlaces(), getUsedSlots(), !!selection.showAll)[0]
  return { ...selection, surface: first?.id }
}

const Workbench = ({ options, mode }: { options: ShellOptions; mode: 'live' | 'preview' }) => {
  const [selection, setSelection] = useState<ShellSelection>(initialSelection)
  const [search, setSearch] = useState('')
  const [inputsOpen, toggleInputs] = useStoredToggle(INPUTS_OPEN, false)
  const [panelOpen, togglePanel] = useStoredToggle(LEFT_OPEN, true)
  const place = getPlace(selection.surface)

  // the URL: a new history entry for another place, the same one for the inputs and switches
  const shown = useRef(navigationKey(selection))
  useEffect(() => {
    const key = navigationKey(selection)
    writeSelection(selection, key !== shown.current)
    shown.current = key
  }, [selection])
  useEffect(() => {
    const onPop = () => {
      const next = readSelection(window.location.search, getPlaces())
      shown.current = navigationKey(next)
      setSelection(next)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])
  // AYON's slot highlighting (shared), which the stage's own markers follow too (slotOverlay.tsx)
  useEffect(() => setSlotHighlight(!!selection.highlight), [selection.highlight])
  // the menus opened in the last place are not this one's
  useEffect(() => clearMenus(), [selection.surface])
  useEffect(() => setStatus({ selection, mode }), [selection, mode])
  // the inputs of each scene, for when the developer comes back to it
  useEffect(() => rememberSceneValues(selection.surface, selection.sceneValues), [selection.surface, selection.sceneValues])

  // "," toggles the developer panel, "/" Context, unless typing
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented || isTyping(e.target)) return
      if (e.key === ',') togglePanel()
      else if (e.key === '/') toggleInputs()
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [togglePanel, toggleInputs])

  // a project to start with
  const { data: projects = [] } = useListProjectsQuery({ active: true }, { skip: mode !== 'live' })
  useEffect(() => {
    if (mode === 'live' && !selection.projectName && projects.length) {
      setSelection((current) => (current.projectName ? current : { ...current, projectName: projects[0].name, entities: [] }))
    }
  }, [mode, projects, selection.projectName])

  return (
    <>
      {/* the addon's services, once for the whole shell as in AYON; not remounted per selection */}
      <AddonServices projectName={selection.projectName ?? null} />
      <Splitter
        className={`ayon-shell${panelOpen ? '' : ' left-collapsed'}`}
        stateKey="ayon-addon-shell"
        stateStorage="local"
      >
        <SplitterPanel size={22} minSize={12} style={{ overflow: 'hidden' }}>
          <StageBoundary what="developer panel">
            <DevPanel
              options={options}
              mode={mode}
              selection={selection}
              search={search}
              onSearch={setSearch}
              onChange={setSelection}
            />
          </StageBoundary>
        </SplitterPanel>
        <SplitterPanel size={78} style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <StageHeader mode={mode} selection={selection} panelOpen={panelOpen} onTogglePanel={() => togglePanel()} />
          <Splitter
            layout="vertical"
            className={`ayon-shell-column${inputsOpen ? '' : ' inputs-collapsed'}`}
            stateKey="ayon-addon-shell-inputs-split"
            stateStorage="local"
          >
            <SplitterPanel size={70} minSize={20} style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <ProjectProviders
                // preview renders the contribution alone: only the table columns need the project
                projectName={
                  mode === 'live' || selection.slot === 'tableColumn' ? selection.projectName : undefined
                }
                light={mode === 'preview'}
              >
                {/* a new place or project starts the project contexts and the slicer fresh */}
                <StageBoundary key={`${selection.surface}:${place?.scene ? '' : selection.projectName || ''}`}>
                  <Stage
                    mode={mode}
                    selection={selection}
                    listedSlots={slotsHere(place, selection, search)}
                    onChange={setSelection}
                    onOpenInputs={() => toggleInputs(true)}
                  />
                </StageBoundary>
              </ProjectProviders>
            </SplitterPanel>
            <SplitterPanel size={30} minSize={10} style={{ overflow: 'hidden' }}>
              <PreviewInputs
                mode={mode}
                selection={selection}
                onChange={setSelection}
                open={inputsOpen}
                onToggle={() => toggleInputs()}
              />
            </SplitterPanel>
          </Splitter>
        </SplitterPanel>
      </Splitter>
    </>
  )
}

export const Shell = ({ options, mode }: { options: ShellOptions; mode: 'live' | 'preview' }) => {
  const store = useMemo(() => {
    const standaloneStore = createStandaloneStore()
    // run and menu pieces dispatch to it through @ynput/ayon-addon, as they do to AYON's store,
    // and get the user its queries loaded in their context
    provideHost({
      dispatch: standaloneStore.dispatch,
      getUser: () => getShellUser(standaloneStore.getState()),
      // navigateToEntity: the shell has none of AYON's pages, so the link opens in AYON
      navigate: (to) => window.open(new URL(to, options.serverUrl).href, '_blank', 'noopener'),
    })
    return standaloneStore
  }, [])
  return (
    <Provider store={store}>
      <SplitterStyles />
      <BrowserRouter>
        {/* as AYON's (app.tsx): useQueryParam from @ynput/ayon-addon reads it */}
        <QueryParamProvider adapter={ReactRouter6Adapter} options={{ updateType: 'replaceIn' }}>
          {mode === 'live' ? (
            <SignedIn options={options}>
              <AppProviders>
                <Workbench options={options} mode={mode} />
              </AppProviders>
            </SignedIn>
          ) : (
            <AppProviders>
              <Workbench options={options} mode={mode} />
            </AppProviders>
          )}
        </QueryParamProvider>
        <ToastContainer position="bottom-right" theme="dark" />
      </BrowserRouter>
    </Provider>
  )
}

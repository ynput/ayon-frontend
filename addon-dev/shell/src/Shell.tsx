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
import { AddonServices, LoginPage, SplitterStyles } from '@ynput/ayon-frontend-shared/components'
import { storeAccessToken } from '@ynput/ayon-frontend-shared/util'
import { useDispatch } from 'react-redux'
import { DevPanel, slotsHere } from './DevPanel'
import { Stage } from './Stage'
import { StageHeader } from './StageHeader'
import { StageBoundary } from './StageBoundary'
import { PreviewInputs } from './PreviewInputs'
import { setStatus } from './status'
import type { ShellOptions, ShellSelection } from './types'
import { navigationKey, readSelection, writeSelection } from './params'
import { provideHost } from '@ynput/ayon-addon/host'
import { getShellUser } from './host'
import { findContribution, getPlace, getPlaces, getUsedSlots } from './catalog'
import { listedPlaces } from './places'
import { setOverlay } from './slotOverlay'

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

const INPUTS_OPEN = 'ayon-addon-shell-inputs'
const readInputsOpen = () => {
  try {
    return localStorage.getItem(INPUTS_OPEN) === '1'
  } catch {
    return false
  }
}

/** The selection in the URL; without a place, the first one this addon uses. */
const initialSelection = () => {
  const selection = readSelection(window.location.search, getPlaces())
  if (selection.surface) return selection
  const first = listedPlaces(getPlaces(), getUsedSlots(), !!selection.showUnused)[0]
  return { ...selection, surface: first?.id }
}

const Workbench = ({ options, mode }: { options: ShellOptions; mode: 'live' | 'preview' }) => {
  const [selection, setSelection] = useState<ShellSelection>(initialSelection)
  const [search, setSearch] = useState('')
  const [inputsOpen, setInputsOpen] = useState(readInputsOpen)
  const place = getPlace(selection.surface)
  const focus = findContribution(selection.slot, selection.id)

  // the URL: a new history entry for another place or focus, the same one for inputs
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
  useEffect(
    () => setOverlay({ showUnused: !!selection.showUnused, focusSlot: selection.slot, focusKey: focus?.key }),
    [selection.showUnused, selection.slot, focus?.key],
  )
  useEffect(() => setStatus({ selection, mode }), [selection, mode])

  // a project to start with
  const { data: projects = [] } = useListProjectsQuery({ active: true }, { skip: mode !== 'live' })
  useEffect(() => {
    if (mode === 'live' && !selection.projectName && projects.length) {
      setSelection((current) => (current.projectName ? current : { ...current, projectName: projects[0].name, entities: [] }))
    }
  }, [mode, projects, selection.projectName])

  const toggleInputs = useCallback(
    (open?: boolean) =>
      setInputsOpen((current) => {
        const next = open ?? !current
        try {
          localStorage.setItem(INPUTS_OPEN, next ? '1' : '0')
        } catch {
          // a viewer convenience only
        }
        return next
      }),
    [],
  )

  return (
    <>
      {/* the addon's services, once for the whole shell as in AYON; not remounted per selection */}
      <AddonServices projectName={selection.projectName ?? null} />
      <Splitter className="ayon-shell" stateKey="ayon-addon-shell" stateStorage="local">
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
          <StageHeader mode={mode} selection={selection} onChange={setSelection} />
          <ProjectProviders
            // preview renders the contribution alone: only the table columns need the project
            projectName={
              mode === 'live' || selection.slot === 'tableColumn' ? selection.projectName : undefined
            }
            light={mode === 'preview'}
          >
            {/* the place stays mounted while the focus inside it changes; a new project starts
                the project contexts and the slicer fresh */}
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
          <PreviewInputs
            mode={mode}
            selection={selection}
            onChange={setSelection}
            open={inputsOpen}
            onToggle={() => toggleInputs()}
          />
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

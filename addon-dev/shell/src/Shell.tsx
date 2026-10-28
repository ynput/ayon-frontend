// The standalone dev shell: the addon's contributions in AYON's real providers and surfaces,
// signed in to a real server (live) or answering from fixtures (preview), with a developer panel.
import { useEffect, useMemo, useState } from 'react'
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
import { Splitter, SplitterPanel } from 'primereact/splitter'
import { createStandaloneStore, useGetCurrentUserQuery } from '@ynput/ayon-frontend-shared/api'
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
import { LoginPage, SplitterStyles } from '@ynput/ayon-frontend-shared/components'
import { storeAccessToken } from '@ynput/ayon-frontend-shared/util'
import { useDispatch } from 'react-redux'
import { DevPanel } from './DevPanel'
import { Stage } from './Stage'
import { StageCaption } from './StageCaption'
import { StageBoundary } from './StageBoundary'
import { setStatus } from './status'
import type { ShellOptions, ShellSelection } from './types'
import { readSelection, writeSelection } from './params'
import { provideHost } from '@ynput/ayon-addon/host'

const Centered = ({ children }: { children: ReactNode }) => (
  <div style={{ display: 'grid', placeItems: 'center', height: '100%' }}>{children}</div>
)

// live: the user of the API key the dev server sends, or the login page (like AYON's)
const SignedIn = ({ options, children }: { options: ShellOptions; children: ReactNode }) => {
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

const Workbench = ({ options, mode }: { options: ShellOptions; mode: 'live' | 'preview' }) => {
  const [selection, setSelection] = useState<ShellSelection>(readSelection)
  useEffect(() => writeSelection(selection), [selection])
  useEffect(() => setStatus({ selection, mode }), [selection, mode])

  return (
    <Splitter className="ayon-shell" stateKey="ayon-addon-shell" stateStorage="local">
      <SplitterPanel size={22} minSize={12} style={{ overflow: 'hidden' }}>
        <StageBoundary what="developer panel">
          <DevPanel options={options} mode={mode} selection={selection} onChange={setSelection} />
        </StageBoundary>
      </SplitterPanel>
      <SplitterPanel size={78} style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <StageCaption mode={mode} selection={selection} />
        <ProjectProviders
          // preview renders the contribution alone: only the table columns need the project
          projectName={
            mode === 'live' || selection.slot === 'tableColumn' ? selection.projectName : undefined
          }
          light={mode === 'preview'}
        >
          <StageBoundary key={`${selection.projectName}:${selection.slot}:${selection.id}`}>
            {/* remounts per project: the project contexts and the slicer start fresh */}
            <Stage
              key={selection.projectName || ''}
              mode={mode}
              selection={selection}
              onChange={setSelection}
            />
          </StageBoundary>
        </ProjectProviders>
      </SplitterPanel>
    </Splitter>
  )
}

export const Shell = ({ options, mode }: { options: ShellOptions; mode: 'live' | 'preview' }) => {
  const store = useMemo(() => {
    const standaloneStore = createStandaloneStore()
    // run and menu pieces dispatch to it through @ynput/ayon-addon, as they do to AYON's store
    provideHost({ dispatch: standaloneStore.dispatch })
    return standaloneStore
  }, [])
  return (
    <Provider store={store}>
      <SplitterStyles />
      <BrowserRouter>
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
        <ToastContainer position="bottom-right" theme="dark" />
      </BrowserRouter>
    </Provider>
  )
}

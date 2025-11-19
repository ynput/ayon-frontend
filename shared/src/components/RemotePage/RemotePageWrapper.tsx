// this is used to render a remote page and provide it with all the props it needs
// NOTE: it must be wrapped with ViewsProvider someone (probably already by WithViews hoc)
import { GenericViewModel } from '@shared/api'
import {
  updateViewSettings,
  UpdateViewSettingsFn,
  useViewsContext,
  useViewUpdateHelper,
  ViewsContextValue,
} from '@shared/containers'
import { FC } from 'react'
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom'

type RouterTypes = {
  useParams: typeof useParams
  useNavigate: typeof useNavigate
  useLocation: typeof useLocation
  useSearchParams: typeof useSearchParams
}

interface ViewsWithReportsSettings extends ViewsContextValue {
  viewSettings: GenericViewModel['settings'] | undefined
  updateViewSettings: UpdateViewSettingsFn
}

export interface RemotePageProps {
  router: RouterTypes
  toast?: any
  views?: ViewsWithReportsSettings
  // project specific
  projectName?: string
  state?: any
}

export interface RemotePageWrapperProps {
  Component: FC<RemotePageProps>
  // project specific
  projectName?: string
  state?: any
}

export const RemotePageWrapper: FC<RemotePageWrapperProps> = ({
  Component,
  projectName,
  state,
}) => {
  const views = useViewsContext()
  const { onCreateView } = useViewUpdateHelper()

  return (
    <Component
      router={{ useParams, useNavigate, useLocation, useSearchParams }}
      projectName={projectName}
      views={{
        ...views,
        updateViewSettings: (...args) => updateViewSettings(...args, views, onCreateView),
      }}
      state={state}
    />
  )
}

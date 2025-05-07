import { FC } from 'react'
import { useRemoteModules } from '@shared/context'
import { useLoadModule } from '@shared/hooks'
import {
  Location,
  NavigateFunction,
  SetURLSearchParams,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom'

interface AppRemoteLoaderProps {}

type ModuleAppProps = {
  addon: {
    addonName: string
    addonVersion: string
  }
  remote: string
  module: string
}

type RemoteAppProps = {
  name: string
  version: string
  location: Location<any>
  searchParams: URLSearchParams
  setSearchParams: SetURLSearchParams
  navigate: NavigateFunction
}

const ModuleApp = ({ addon, remote, module }: ModuleAppProps) => {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [RemoteApp, { isLoaded }] = useLoadModule<FC<RemoteAppProps>>({
    addon: addon.addonName,
    remote,
    module,
    fallback: () => null,
  })

  if (!isLoaded) return null

  const id = `${addon.addonName}-${remote}-${module}`

  return (
    <RemoteApp
      key={id}
      name={addon.addonName}
      version={addon.addonVersion}
      location={location}
      searchParams={searchParams}
      setSearchParams={setSearchParams}
      navigate={navigate}
    />
  )
}

const AppRemoteLoader: FC<AppRemoteLoaderProps> = () => {
  const { modules } = useRemoteModules()

  return modules.map((addon) =>
    Object.entries(addon.modules).map(([remote, modulesList]) =>
      modulesList
        .filter((m) => m.includes('App'))
        .map((module) => <ModuleApp module={module} remote={remote} addon={addon} />),
    ),
  )
}

export default AppRemoteLoader

import { useEffect } from 'react'
import { useRemoteModules } from '@shared/context/RemoteModulesContext'
import { loadRemoteCSS as loadRemoteCSSUtil } from '@shared/utils/loadRemoteCSS'

interface UseLoadRemoteCSSProps {
  addonName: string
  remoteName: string
  isLoaded: boolean
}

export const useLoadRemoteCSS = ({ addonName, remoteName, isLoaded }: UseLoadRemoteCSSProps) => {
  const { modules } = useRemoteModules()

  useEffect(() => {
    if (isLoaded) {
      // Get the addon version from the remote modules context
      const addon = modules.find(m => m.addonName === addonName)
      const addonVersion = addon?.addonVersion || '0.1.0-dev'
      loadRemoteCSSUtil(addonName, addonVersion, remoteName)
    }
  }, [isLoaded, modules, addonName, remoteName])
}

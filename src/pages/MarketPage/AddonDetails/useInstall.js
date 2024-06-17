import { useState } from 'react'
import { useInstallAddonsMutation } from '@/services/addons/updateAddons'
import { useLazyGetMarketAddonVersionQuery } from '@/services/market/getMarket'
import { toast } from 'react-toastify'

const useInstall = (onInstall) => {
  const [error, setError] = useState(null)

  const [installAddons] = useInstallAddonsMutation()
  const [getAddonVersion] = useLazyGetMarketAddonVersionQuery()

  const installAddon = async (name, version) => {
    try {
      if (!version) return new Error('No version found')
      if (!name) return new Error('No name found')

      // first get version to get url
      const { data, error } = await getAddonVersion({ id: name, version })

      if (error) throw new Error(error.message)

      if (!data?.url) throw new Error('No install candidate found')

      const { error: installError } = await installAddons({
        addons: [{ url: data.url, name, version }],
      }).unwrap()

      if (installError) throw new Error(installError)

      onInstall(name)
    } catch (error) {
      console.error(error)

      setError(error?.message || 'Error installing addon')

      toast.error(error?.message || 'Error installing addon')
    }
  }

  return {
    installAddon,
    error,
  }
}

export default useInstall

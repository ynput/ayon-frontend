import { useState } from 'react'
import { useInstallAddonsMutation } from '/src/services/addons/updateAddons'
import { useLazyGetMarketAddonVersionQuery } from '/src/services/market/getMarket'
import { toast } from 'react-toastify'

const useInstall = (onInstall) => {
  const [error, setError] = useState(null)

  const [installAddons] = useInstallAddonsMutation()
  const [getAddonVersion] = useLazyGetMarketAddonVersionQuery()

  const installAddon = async (name, version) => {
    try {
      if (!version) return new Error('No version found')
      if (!name) return new Error('No name found')

      onInstall(name)
      // first get version to get url
      const { data, error } = await getAddonVersion({ id: name, version })

      if (error) throw new Error(error.message)

      if (!data?.url) return new Error('No url found')

      await installAddons({ addons: [{ url: data.url, name, version }] }).unwrap()
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
